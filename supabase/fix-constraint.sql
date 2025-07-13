-- Fix calculation_method constraint to support method 13 (Turkey)
ALTER TABLE user_profiles 
DROP CONSTRAINT check_calculation_method_range;

ALTER TABLE user_profiles 
ADD CONSTRAINT check_calculation_method_range 
CHECK (calculation_method >= 0 AND calculation_method <= 15);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'user_profiles' 
    AND conname = 'check_calculation_method_range'; 