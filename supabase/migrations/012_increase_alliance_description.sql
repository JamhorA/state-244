-- Increase alliance description length to allow for professional stories
ALTER TABLE alliances 
DROP CONSTRAINT alliances_description_check;

ALTER TABLE alliances
ADD CONSTRAINT alliances_description_check 
CHECK (char_length(description) <= 5000);
