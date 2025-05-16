-- Update video URLs to use the correct format
UPDATE videos 
SET video_url = CONCAT('/uploads/videos/', SUBSTRING_INDEX(video_url, '/', -1))
WHERE video_url NOT LIKE '/uploads/videos/%';

UPDATE videos 
SET thumbnail_url = CONCAT('/uploads/thumbnails/', SUBSTRING_INDEX(thumbnail_url, '/', -1))
WHERE thumbnail_url NOT LIKE '/uploads/thumbnails/%'; 