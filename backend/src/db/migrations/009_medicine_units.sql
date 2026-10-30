-- وحدات البيع لكل دواء
-- sale_unit: الوحدة الأساسية للبيع (مثال: شريط، حبة، زجاجة)
-- pack_unit: وحدة العبوة الأكبر (مثال: علبة، كرتونة) — اختياري
-- units_per_pack: كم وحدة أساسية في العبوة (مثال: 10 شرائط في العلبة)

ALTER TABLE medicines ADD COLUMN sale_unit TEXT NOT NULL DEFAULT 'علبة';
ALTER TABLE medicines ADD COLUMN pack_unit TEXT;
ALTER TABLE medicines ADD COLUMN units_per_pack INTEGER NOT NULL DEFAULT 1;

