-- ERP Sistema Químico Industrial - Schema PostgreSQL
-- Cumplimiento ISO 9001:2015

-- Crear base de datos
-- CREATE DATABASE chemical_erp;
-- \c chemical_erp;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tipos personalizados
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'quality', 'lab_technician', 'supervisor');
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE quality_status AS ENUM ('pending', 'approved', 'rejected', 'rework');
CREATE TYPE process_type AS ENUM ('anodizing', 'zinc_plating', 'chromating', 'pretreatment', 'painting');
CREATE TYPE chemical_type AS ENUM ('acid', 'base', 'salt', 'solvent', 'additive', 'water');
CREATE TYPE non_conformity_type AS ENUM ('dimensional', 'surface', 'coating_thickness', 'adhesion', 'corrosion', 'color');
CREATE TYPE capa_type AS ENUM ('corrective', 'preventive');

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Tabla de Clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Especificaciones de Cliente
CREATE TABLE customer_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    specification_code VARCHAR(50) NOT NULL,
    description TEXT,
    standard_reference VARCHAR(100), -- Ej: ISO 2081, ASTM B633
    coating_type VARCHAR(50), -- Ej: Fe/Zn 5 C 1 A
    thickness_min DECIMAL(10,3),
    thickness_max DECIMAL(10,3),
    adhesion_test BOOLEAN DEFAULT true,
    salt_spray_hours INTEGER,
    color_requirement VARCHAR(50),
    special_requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Líneas de Producción
CREATE TABLE production_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    process_type process_type NOT NULL,
    capacity_per_hour INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Procesos Químicos
CREATE TABLE chemical_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_line_id UUID REFERENCES production_lines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sequence_order INTEGER NOT NULL,
    bath_name VARCHAR(100),
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    time_min INTEGER, -- minutos
    time_max INTEGER, -- minutos
    ph_min DECIMAL(4,2),
    ph_max DECIMAL(4,2),
    concentration_min DECIMAL(10,4),
    concentration_max DECIMAL(10,4),
    description TEXT,
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Materias Primas (Químicos)
CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    chemical_type chemical_type NOT NULL,
    cas_number VARCHAR(50),
    supplier VARCHAR(100),
    safety_data_sheet TEXT, -- URL o referencia a SDS
    storage_requirements TEXT,
    hazardous BOOLEAN DEFAULT false,
    unit_of_measure VARCHAR(20) NOT NULL, -- kg, L, etc.
    current_stock DECIMAL(12,4) DEFAULT 0,
    minimum_stock DECIMAL(12,4) DEFAULT 0,
    maximum_stock DECIMAL(12,4),
    cost_per_unit DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Órdenes de Trabajo de Cliente
CREATE TABLE customer_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    specification_id UUID REFERENCES customer_specifications(id) ON DELETE RESTRICT,
    part_number VARCHAR(100),
    part_description TEXT,
    quantity_ordered INTEGER NOT NULL,
    quantity_delivered INTEGER DEFAULT 0,
    unit_price DECIMAL(10,4),
    delivery_date DATE,
    priority VARCHAR(20) DEFAULT 'normal',
    notes TEXT,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Órdenes de Producción
CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_order_id UUID REFERENCES customer_orders(id) ON DELETE RESTRICT,
    production_line_id UUID REFERENCES production_lines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50),
    quantity_planned INTEGER NOT NULL,
    quantity_produced INTEGER DEFAULT 0,
    quantity_scrap INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status order_status DEFAULT 'pending',
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registro de Procesos
CREATE TABLE process_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    chemical_process_id UUID REFERENCES chemical_processes(id) ON DELETE RESTRICT,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    actual_temperature DECIMAL(5,2),
    actual_time INTEGER, -- minutos
    actual_ph DECIMAL(4,2),
    actual_concentration DECIMAL(10,4),
    observations TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Consumo de Materias Primas
CREATE TABLE material_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    raw_material_id UUID REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity_used DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(10,4),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Inspecciones de Calidad
CREATE TABLE quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    inspection_type VARCHAR(50) NOT NULL, -- 'incoming', 'in_process', 'final', 'customer'
    results JSONB, -- Resultados de la inspección en formato JSON
    status quality_status DEFAULT 'pending',
    non_conformities_found INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de No Conformidades
CREATE TABLE non_conformities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES quality_inspections(id) ON DELETE CASCADE,
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    type non_conformity_type NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'minor', -- 'minor', 'major', 'critical'
    detected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    detection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    root_cause TEXT,
    affected_quantity INTEGER,
    images_urls TEXT[], -- Array de URLs a imágenes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Acciones Correctivas y Preventivas (CAPA)
CREATE TABLE capa_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    non_conformity_id UUID REFERENCES non_conformities(id) ON DELETE CASCADE,
    type capa_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'verified'
    effectiveness_rating INTEGER, -- 1-5
    verification_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditorías Internas
CREATE TABLE internal_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_number VARCHAR(50) UNIQUE NOT NULL,
    audit_date DATE NOT NULL,
    auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL, -- 'system', 'process', 'product', 'supplier'
    scope TEXT,
    findings JSONB,
    non_conformities INTEGER DEFAULT 0,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Análisis de Laboratorio
CREATE TABLE laboratory_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_number VARCHAR(50) UNIQUE NOT NULL,
    sample_id VARCHAR(50),
    sample_date TIMESTAMP WITH TIME ZONE,
    analysis_type VARCHAR(50) NOT NULL, -- 'ph', 'concentration', 'titration', 'contamination'
    bath_name VARCHAR(100),
    production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
    analyst_id UUID REFERENCES users(id) ON DELETE SET NULL,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    results JSONB NOT NULL, -- Resultados del análisis
    specification_limits JSONB, -- Límites especificados
    is_within_specification BOOLEAN,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tendencias de Laboratorio
CREATE TABLE laboratory_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES laboratory_analyses(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(15,6) NOT NULL,
    trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
    deviation_from_target DECIMAL(15,6),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de KPIs y Métricas
CREATE TABLE kpi_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value DECIMAL(15,6) NOT NULL,
    target_value DECIMAL(15,6),
    unit VARCHAR(20),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de consultas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customer_orders_customer_id ON customer_orders(customer_id);
CREATE INDEX idx_customer_orders_status ON customer_orders(status);
CREATE INDEX idx_production_orders_work_order_number ON production_orders(work_order_number);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_start_date ON production_orders(start_date);
CREATE INDEX idx_process_records_production_order_id ON process_records(production_order_id);
CREATE INDEX idx_quality_inspections_production_order_id ON quality_inspections(production_order_id);
CREATE INDEX idx_quality_inspections_status ON quality_inspections(status);
CREATE INDEX idx_non_conformities_status ON non_conformities(status);
CREATE INDEX idx_non_conformities_detection_date ON non_conformities(detection_date);
CREATE INDEX idx_laboratory_analyses_analysis_date ON laboratory_analyses(analysis_date);
CREATE INDEX idx_laboratory_analyses_bath_name ON laboratory_analyses(bath_name);
CREATE INDEX idx_raw_materials_code ON raw_materials(code);
CREATE INDEX idx_raw_materials_current_stock ON raw_materials(current_stock);

-- Triggers para actualización automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_specifications_updated_at BEFORE UPDATE ON customer_specifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_lines_updated_at BEFORE UPDATE ON production_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chemical_processes_updated_at BEFORE UPDATE ON chemical_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_orders_updated_at BEFORE UPDATE ON customer_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON production_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_inspections_updated_at BEFORE UPDATE ON quality_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_non_conformities_updated_at BEFORE UPDATE ON non_conformities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capa_actions_updated_at BEFORE UPDATE ON capa_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_internal_audits_updated_at BEFORE UPDATE ON internal_audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funciones para generación de números secuenciales
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'WO-';
    year_part TEXT := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    month_part TEXT := LPAD(EXTRACT(month FROM CURRENT_DATE)::TEXT, 2, '0');
    sequence_value INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_value
    FROM production_orders
    WHERE work_order_number LIKE prefix || year_part || '-' || month_part || '-%';
    
    RETURN prefix || year_part || '-' || month_part || '-' || LPAD(sequence_value::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_analysis_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'AN-';
    year_part TEXT := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    sequence_value INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(analysis_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_value
    FROM laboratory_analyses
    WHERE analysis_number LIKE prefix || year_part || '-%';
    
    RETURN prefix || year_part || '-' || LPAD(sequence_value::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Vistas útiles para reportes
CREATE VIEW v_production_summary AS
SELECT 
    po.id,
    po.work_order_number,
    po.quantity_planned,
    po.quantity_produced,
    po.quantity_scrap,
    po.status,
    po.start_date,
    po.end_date,
    co.order_number,
    c.name as customer_name,
    pl.name as production_line_name,
    pl.process_type,
    u.first_name || ' ' || u.last_name as operator_name,
    CASE 
        WHEN po.quantity_planned > 0 THEN 
            ROUND((po.quantity_produced::DECIMAL / po.quantity_planned::DECIMAL) * 100, 2)
        ELSE 0 
    END as efficiency_percentage
FROM production_orders po
LEFT JOIN customer_orders co ON po.customer_order_id = co.id
LEFT JOIN customers c ON co.customer_id = c.id
LEFT JOIN production_lines pl ON po.production_line_id = pl.id
LEFT JOIN users u ON po.operator_id = u.id;

CREATE VIEW v_quality_summary AS
SELECT 
    qi.id,
    qi.inspection_date,
    qi.inspection_type,
    qi.status,
    qi.non_conformities_found,
    po.work_order_number,
    c.name as customer_name,
    u.first_name || ' ' || u.last_name as inspector_name,
    CASE 
        WHEN qi.status = 'approved' THEN 'Aprobado'
        WHEN qi.status = 'rejected' THEN 'Rechazado'
        WHEN qi.status = 'pending' THEN 'Pendiente'
        ELSE 'Rework'
    END as status_description
FROM quality_inspections qi
LEFT JOIN production_orders po ON qi.production_order_id = po.id
LEFT JOIN customer_orders co ON po.customer_order_id = co.id
LEFT JOIN customers c ON co.customer_id = c.id
LEFT JOIN users u ON qi.inspector_id = u.id;

CREATE VIEW v_inventory_status AS
SELECT 
    rm.id,
    rm.code,
    rm.name,
    rm.chemical_type,
    rm.current_stock,
    rm.minimum_stock,
    rm.maximum_stock,
    rm.unit_of_measure,
    rm.cost_per_unit,
    CASE 
        WHEN rm.current_stock <= rm.minimum_stock THEN 'CRITICAL'
        WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 'LOW'
        WHEN rm.current_stock >= rm.maximum_stock THEN 'OVERSTOCK'
        ELSE 'NORMAL'
    END as stock_status,
    ROUND(rm.current_stock * rm.cost_per_unit, 2) as total_value
FROM raw_materials rm
WHERE rm.is_active = true;

COMMIT;
