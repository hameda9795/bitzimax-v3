// Share Modal functionality
document.addEventListener('DOMContentLoaded', function() {
  let shareButton = document.querySelector('.share-button');
  let shareModal = document.querySelector('.share-modal');
  
  // Only attach listeners if elements exist
  if (shareButton && shareModal) {
    shareButton.addEventListener('click', function() {
      shareModal.classList.toggle('show');
    });
    
    // Close button
    const closeButton = shareModal.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        shareModal.classList.remove('show');
      });
    }
    
    // Close when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target == shareModal) {
        shareModal.classList.remove('show');
      }
    });
  }
});
