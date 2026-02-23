-- Increase the maximum length of motivation to accommodate formatted application data and screenshot URLs
ALTER TABLE migration_applications 
DROP CONSTRAINT migration_applications_motivation_check;

ALTER TABLE migration_applications
ADD CONSTRAINT migration_applications_motivation_check 
CHECK (char_length(motivation) >= 10 AND char_length(motivation) <= 3000);
