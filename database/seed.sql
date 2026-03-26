-- Datos iniciales para ERP Sistema Químico Industrial
-- Ejecutar después de schema.sql

-- Insertar usuarios iniciales
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@chemical-erp.com', '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk', 'Administrador', 'Sistema', 'admin'),
('jsmith', 'juan.smith@chemical-erp.com', '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk', 'Juan', 'Smith', 'operator'),
('mgarcia', 'maria.garcia@chemical-erp.com', '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk', 'María', 'García', 'quality'),
('rlopez', 'roberto.lopez@chemical-erp.com', '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk', 'Roberto', 'López', 'lab_technician'),
('amartinez', 'ana.martinez@chemical-erp.com', '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk', 'Ana', 'Martínez', 'supervisor');

-- Insertar clientes de ejemplo
INSERT INTO customers (code, name, contact_name, email, phone, address, tax_id) VALUES
('C001', 'Automotriz del Norte S.A.', 'Carlos Rodríguez', 'carlos.rodriguez@automotriznorte.com', '555-0101', 'Av. Industrial 123, Monterrey, NL', 'AUT010101ABC'),
('C002', 'Componentes Aeroespaciales Ltd.', 'Laura Sánchez', 'laura.sanchez@aero-components.com', '555-0102', 'Parque Tecnológico 456, Querétaro, QRO', 'AER020202XYZ'),
('C003', 'Electrodomésticos del Centro', 'Pedro Gómez', 'pedro.gomez@electrocentro.com', '555-0103', 'Zona Industrial 789, León, GTO', 'ELE030303DEF'),
('C004', 'Construcciones Metálicas S.A.', 'Margarita Torres', 'margarita.torres@construmetal.com', '555-0104', 'Carretera a Saltillo 321, Saltillo, COH', 'CON040404GHI'),
('C005', 'Industria Agrícola del Bajío', 'Jorge Hernández', 'jorge.hernandez@agrobajio.com', '555-0105', 'Km 10 Carretera Celaya, Celaya, GTO', 'AGR050505JKL');

-- Insertar especificaciones de cliente
INSERT INTO customer_specifications (customer_id, specification_code, description, standard_reference, coating_type, thickness_min, thickness_max, adhesion_test, salt_spray_hours, color_requirement) VALUES
((SELECT id FROM customers WHERE code = 'C001'), 'AUT-001', 'Recubrimiento para componentes de motor', 'ISO 2081', 'Fe/Zn 5 C 1 A', 5.0, 12.0, true, 96, 'Negro mate'),
((SELECT id FROM customers WHERE code = 'C001'), 'AUT-002', 'Anodizado para piezas decorativas', 'ISO 7599', 'Anodizado Tipo II', 5.0, 25.0, true, 336, 'Plateado brillante'),
((SELECT id FROM customers WHERE code = 'C002'), 'AER-001', 'Recubrimiento anticorrosivo para aviónica', 'ASTM B633', 'Fe/Zn 8 C 2 A', 8.0, 20.0, true, 500, 'Gris claro'),
((SELECT id FROM customers WHERE code = 'C003'), 'ELE-001', 'Zinc plating para tornillería', 'ISO 2081', 'Fe/Zn 5 C 1 A', 5.0, 8.0, true, 72, 'Transparente'),
((SELECT id FROM customers WHERE code = 'C004'), 'CON-001', 'Recubrimiento estructural', 'ISO 12944', 'Fe/Zn 12 C 2 A', 12.0, 25.0, true, 720, 'Verde oscuro'),
((SELECT id FROM customers WHERE code = 'C005'), 'AGR-001', 'Recubrimiento para equipo agrícola', 'ISO 2081', 'Fe/Zn 8 C 1 A', 8.0, 15.0, true, 96, 'Negro');

-- Insertar líneas de producción
INSERT INTO production_lines (name, description, process_type, capacity_per_hour) VALUES
('Línea de Anodizado 1', 'Línea principal para anodizado de aluminio', 'anodizing', 200),
('Línea de Zinc Plating 1', 'Línea de zincado por inmersión', 'zinc_plating', 300),
('Línea de Cromatizado 1', 'Línea de pasivado y cromatizado', 'chromating', 150),
('Línea de Pretratamiento 1', 'Limpieza y preparación de superficies', 'pretreatment', 400),
('Línea de Pintura 1', 'Aplicación de pinturas en polvo', 'painting', 100);

-- Insertar procesos químicos por línea de producción
-- Procesos para Anodizado
INSERT INTO chemical_processes (production_line_id, name, sequence_order, bath_name, temperature_min, temperature_max, time_min, time_max, ph_min, ph_max, concentration_min, concentration_max, is_critical) VALUES
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Desengrase', 1, 'Desengrasante Alcalino', 50.0, 60.0, 5, 10, 9.0, 11.0, 30.0, 50.0, false),
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Etch', 2, 'Soda Cáustica', 45.0, 55.0, 2, 5, NULL, NULL, 50.0, 80.0, true),
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Desmut', 3, 'Ácido Nítrico', 20.0, 25.0, 1, 2, NULL, NULL, 30.0, 50.0, false),
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Anodizado', 4, 'Ácido Sulfúrico', 18.0, 22.0, 30, 60, NULL, NULL, 180.0, 220.0, true),
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Coloración', 5, 'Colorante Orgánico', 25.0, 35.0, 2, 8, 5.5, 6.5, 1.0, 5.0, false),
((SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'Sellado', 6, 'Agua Desionizada', 95.0, 98.0, 15, 25, 5.5, 6.5, NULL, NULL, true);

-- Procesos para Zinc Plating
INSERT INTO chemical_processes (production_line_id, name, sequence_order, bath_name, temperature_min, temperature_max, time_min, time_max, ph_min, ph_max, concentration_min, concentration_max, is_critical) VALUES
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Desengrase', 1, 'Desengrasante Alcalino', 50.0, 60.0, 5, 10, 9.0, 11.0, 30.0, 50.0, false),
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Decapado', 2, 'Ácido Clorhídrico', 20.0, 25.0, 2, 5, NULL, NULL, 100.0, 150.0, true),
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Activación', 3, 'Ácido Sulfúrico', 20.0, 25.0, 1, 2, NULL, NULL, 50.0, 80.0, false),
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Zincado', 4, 'Baño de Zinc', 25.0, 35.0, 15, 30, 4.5, 5.5, 20.0, 35.0, true),
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Pasivado', 5, 'Cromato Hexavalente', 20.0, 25.0, 1, 3, 1.2, 1.8, 2.0, 5.0, true),
((SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'Secado', 6, 'Aire Caliente', 80.0, 100.0, 5, 10, NULL, NULL, NULL, NULL, false);

-- Insertar materias primas
INSERT INTO raw_materials (code, name, chemical_type, cas_number, supplier, hazardous, unit_of_measure, current_stock, minimum_stock, maximum_stock, cost_per_unit) VALUES
('RM001', 'Soda Cáustica', 'base', '1310-73-2', 'Química Industrial S.A.', true, 'kg', 500.0, 100.0, 2000.0, 2.50),
('RM002', 'Ácido Sulfúrico', 'acid', '7664-93-9', 'Ácidos del Norte S.A.', true, 'L', 800.0, 200.0, 3000.0, 1.80),
('RM003', 'Ácido Nítrico', 'acid', '7697-37-2', 'Química Industrial S.A.', true, 'L', 300.0, 100.0, 1500.0, 3.20),
('RM004', 'Ácido Clorhídrico', 'acid', '7647-01-0', 'Ácidos del Norte S.A.', true, 'L', 600.0, 150.0, 2500.0, 1.50),
('RM005', 'Sulfato de Zinc', 'salt', '7733-02-0', 'Minerales del Centro S.A.', false, 'kg', 1200.0, 300.0, 4000.0, 4.80),
('RM006', 'Cromato de Potasio', 'salt', '7789-00-6', 'Química Especializada Ltd.', true, 'kg', 50.0, 20.0, 500.0, 15.60),
('RM007', 'Desengrasante Alcalino', 'additive', NULL, 'Químicos Industriales S.A.', false, 'L', 200.0, 50.0, 800.0, 8.90),
('RM008', 'Colorante Orgánico Negro', 'additive', NULL, 'Colorantes Químicos S.A.', false, 'kg', 80.0, 25.0, 400.0, 25.40),
('RM009', 'Níquel Sulfato', 'salt', '7786-81-4', 'Minerales del Centro S.A.', false, 'kg', 150.0, 40.0, 800.0, 12.30),
('RM010', 'Agua Desionizada', 'water', NULL, 'Sistemas de Purificación S.A.', false, 'L', 5000.0, 1000.0, 20000.0, 0.15);

-- Insertar órdenes de cliente de ejemplo
INSERT INTO customer_orders (order_number, customer_id, specification_id, part_number, part_description, quantity_ordered, unit_price, delivery_date, priority, notes) VALUES
('ORD-2024-001', (SELECT id FROM customers WHERE code = 'C001'), (SELECT id FROM customer_specifications WHERE specification_code = 'AUT-001'), 'AUT-MOTOR-001', 'Soporte de motor', 500, 15.50, '2024-02-15', 'high', 'Entrega urgente para línea de producción'),
('ORD-2024-002', (SELECT id FROM customers WHERE code = 'C002'), (SELECT id FROM customer_specifications WHERE specification_code = 'AER-001'), 'AERO-AVION-001', 'Componente de aviónica', 200, 45.80, '2024-02-20', 'high', 'Certificación aeronáutica requerida'),
('ORD-2024-003', (SELECT id FROM customers WHERE code = 'C003'), (SELECT id FROM customer_specifications WHERE specification_code = 'ELE-001'), 'ELE-TORN-001', 'Tornillería M8x20', 2000, 2.30, '2024-02-10', 'normal', 'Lote completo requerido'),
('ORD-2024-004', (SELECT id FROM customers WHERE code = 'C004'), (SELECT id FROM customer_specifications WHERE specification_code = 'CON-001'), 'CON-ESTR-001', 'Viga estructural', 100, 125.00, '2024-02-25', 'normal', 'Inspección dimensional crítica'),
('ORD-2024-005', (SELECT id FROM customers WHERE code = 'C005'), (SELECT id FROM customer_specifications WHERE specification_code = 'AGR-001'), 'AGR-MAQ-001', 'Pieza de maquinaria agrícola', 300, 35.60, '2024-02-18', 'medium', 'Ambiente corrosivo');

-- Insertar órdenes de producción
INSERT INTO production_orders (work_order_number, customer_order_id, production_line_id, batch_number, quantity_planned, quantity_produced, quantity_scrap, start_date, status, operator_id, supervisor_id, notes) VALUES
('WO-2024-01-0001', (SELECT id FROM customer_orders WHERE order_number = 'ORD-2024-001'), (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'BATCH-ZN-001', 500, 480, 20, '2024-01-15 08:00:00', 'completed', (SELECT id FROM users WHERE username = 'jsmith'), (SELECT id FROM users WHERE username = 'amartinez'), 'Proceso completado con scrap dentro de límites'),
('WO-2024-01-0002', (SELECT id FROM customer_orders WHERE order_number = 'ORD-2024-002'), (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'BATCH-ZN-002', 200, 0, 0, '2024-01-16 09:00:00', 'in_progress', (SELECT id FROM users WHERE username = 'jsmith'), (SELECT id FROM users WHERE username = 'amartinez'), 'En proceso de zincado'),
('WO-2024-01-0003', (SELECT id FROM customer_orders WHERE order_number = 'ORD-2024-003'), (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'BATCH-ZN-003', 2000, 0, 0, NULL, 'pending', NULL, (SELECT id FROM users WHERE username = 'amartinez'), 'Pendiente de programar'),
('WO-2024-01-0004', (SELECT id FROM customer_orders WHERE order_number = 'ORD-2024-004'), (SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), 'BATCH-AN-001', 100, 0, 0, NULL, 'pending', NULL, (SELECT id FROM users WHERE username = 'amartinez'), 'Pendiente de programar'),
('WO-2024-01-0005', (SELECT id FROM customer_orders WHERE order_number = 'ORD-2024-005'), (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), 'BATCH-ZN-004', 300, 0, 0, NULL, 'pending', NULL, (SELECT id FROM users WHERE username = 'amartinez'), 'Pendiente de programar');

-- Insertar registros de procesos (ejemplo para la orden completada)
INSERT INTO process_records (production_order_id, chemical_process_id, operator_id, start_time, end_time, actual_temperature, actual_time, actual_ph, actual_concentration, observations, status) VALUES
-- Para WO-2024-01-0001 (Zinc Plating)
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Desengrase' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:00:00', '2024-01-15 08:08:00', 55.0, 8, 10.2, 35.0, 'Proceso normal', 'completed'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Decapado' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:10:00', '2024-01-15 08:14:00', 22.0, 4, NULL, 120.0, 'Buena remoción de óxido', 'completed'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Activación' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:15:00', '2024-01-15 08:16:00', 23.0, 1, NULL, 65.0, 'Activación correcta', 'completed'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Zincado' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:18:00', '2024-01-15 08:43:00', 28.0, 25, 5.1, 28.0, 'Espesor uniforme', 'completed'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Pasivado' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:45:00', '2024-01-15 08:47:00', 22.0, 2, 1.5, 3.5, 'Color correcto', 'completed'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM chemical_processes WHERE name = 'Secado' AND production_line_id = (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1')), (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:48:00', '2024-01-15 08:55:00', 90.0, 7, NULL, NULL, 'Secado completo', 'completed');

-- Insertar consumo de materias primas
INSERT INTO material_consumption (production_order_id, raw_material_id, quantity_used, unit_cost, recorded_by, recorded_at) VALUES
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM raw_materials WHERE code = 'RM007'), 15.0, 8.90, (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:00:00'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM raw_materials WHERE code = 'RM004'), 8.0, 1.50, (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:10:00'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM raw_materials WHERE code = 'RM002'), 3.0, 1.80, (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:15:00'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM raw_materials WHERE code = 'RM005'), 25.0, 4.80, (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:18:00'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM raw_materials WHERE code = 'RM006'), 2.5, 15.60, (SELECT id FROM users WHERE username = 'jsmith'), '2024-01-15 08:45:00');

-- Insertar inspecciones de calidad
INSERT INTO quality_inspections (production_order_id, inspector_id, inspection_date, inspection_type, results, status, non_conformities_found, notes) VALUES
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0001'), (SELECT id FROM users WHERE username = 'mgarcia'), '2024-01-15 09:30:00', 'final', '{"thickness": {"measured": 8.5, "spec_min": 5.0, "spec_max": 12.0, "result": "pass"}, "adhesion": {"result": "pass", "method": "tape_test"}, "appearance": {"result": "pass", "defects": "none"}}', 'approved', 0, 'Inspección final aprobada'),
((SELECT id FROM production_orders WHERE work_order_number = 'WO-2024-01-0002'), (SELECT id FROM users WHERE username = 'mgarcia'), '2024-01-16 10:00:00', 'in_process', '{"temperature": {"measured": 28.0, "spec_min": 25.0, "spec_max": 35.0, "result": "pass"}, "ph": {"measured": 5.1, "spec_min": 4.5, "spec_max": 5.5, "result": "pass"}}', 'pending', 0, 'Inspección en proceso');

-- Insertar análisis de laboratorio
INSERT INTO laboratory_analyses (analysis_number, sample_id, sample_date, analysis_type, bath_name, production_line_id, analyst_id, analysis_date, results, specification_limits, is_within_specification, observations) VALUES
('AN-2024-00001', 'BATH-ZN-001', '2024-01-15 07:00:00', 'concentration', 'Baño de Zinc', (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), (SELECT id FROM users WHERE username = 'rlopez'), '2024-01-15 07:30:00', '{"zinc_concentration": 28.5, "ph": 5.1, "temperature": 28.0}', '{"zinc_concentration": {"min": 20.0, "max": 35.0}, "ph": {"min": 4.5, "max": 5.5}, "temperature": {"min": 25.0, "max": 35.0}}', true, 'Baño dentro de especificaciones'),
('AN-2024-00002', 'BATH-AN-001', '2024-01-15 08:00:00', 'ph', 'Ácido Sulfúrico', (SELECT id FROM production_lines WHERE name = 'Línea de Anodizado 1'), (SELECT id FROM users WHERE username = 'rlopez'), '2024-01-15 08:15:00', '{"sulfuric_acid_concentration": 195.0, "temperature": 20.5}', '{"sulfuric_acid_concentration": {"min": 180.0, "max": 220.0}, "temperature": {"min": 18.0, "max": 22.0}}', true, 'Concentración ligeramente baja, requiere ajuste'),
('AN-2024-00003', 'BATH-PAS-001', '2024-01-15 09:00:00', 'contamination', 'Cromato Hexavalente', (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), (SELECT id FROM users WHERE username = 'rlopez'), '2024-01-15 09:20:00', '{"chromate_concentration": 3.2, "ph": 1.5, "contaminants": {"zn": 0.8, "fe": 0.2}}', '{"chromate_concentration": {"min": 2.0, "max": 5.0}, "ph": {"min": 1.2, "max": 1.8}, "contaminants": {"zn": {"max": 2.0}, "fe": {"max": 0.5}}}', true, 'Niveles de contaminación aceptables');

-- Insertar auditorías internas
INSERT INTO internal_audits (audit_number, audit_date, auditor_id, audit_type, scope, findings, non_conformities, recommendations, follow_up_required, status) VALUES
('AUD-2024-001', '2024-01-10', (SELECT id FROM users WHERE username = 'mgarcia'), 'process', 'Línea de Zinc Plating - Proceso completo', '{"calibration": "pass", "documentation": "pass", "training": "minor_observation", "safety": "pass"}', 1, 'Actualizar registros de capacitación del operador Juan Smith', true, 'completed'),
('AUD-2024-002', '2024-01-15', (SELECT id FROM users WHERE username = 'mgarcia'), 'system', 'Sistema de Gestión de Calidad ISO 9001:2015', '{"procedures": "pass", "records": "pass", "management_review": "pass", "continuous_improvement": "pass"}', 0, 'Sistema funcionando correctamente', false, 'completed');

-- Insertar KPIs
INSERT INTO kpi_records (kpi_name, kpi_value, target_value, unit, period_start, period_end, production_line_id, recorded_by) VALUES
('efficiency', 96.0, 95.0, '%', '2024-01-15', '2024-01-15', (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), (SELECT id FROM users WHERE username = 'amartinez')),
('scrap_rate', 4.0, 5.0, '%', '2024-01-15', '2024-01-15', (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), (SELECT id FROM users WHERE username = 'amartinez')),
('on_time_delivery', 100.0, 95.0, '%', '2024-01-01', '2024-01-31', NULL, (SELECT id FROM users WHERE username = 'admin')),
('quality_pass_rate', 100.0, 98.0, '%', '2024-01-15', '2024-01-15', (SELECT id FROM production_lines WHERE name = 'Línea de Zinc Plating 1'), (SELECT id FROM users WHERE username = 'mgarcia'));

COMMIT;
