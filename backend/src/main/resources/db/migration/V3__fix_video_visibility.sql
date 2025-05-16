-- Set visibility to true for all existing videos
UPDATE videos SET is_visible = TRUE WHERE is_visible IS NULL;

-- Set conversion status to COMPLETED for videos without status
UPDATE videos SET conversion_status = 'COMPLETED' WHERE conversion_status IS NULL;