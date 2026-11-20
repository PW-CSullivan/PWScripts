document.addEventListener('DOMContentLoaded', () => {
  // Reuse existing #lightbox if present, otherwise create it automatically
  let lightbox = document.getElementById('lightbox');
  let lightboxImg = document.getElementById('lightbox-img');

  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'lightbox';

    lightboxImg = document.createElement('img');
    lightboxImg.id = 'lightbox-img';

    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);
  }

  // Open lightbox when any .zoomable image is clicked
  document.querySelectorAll('.zoomable').forEach(img => {
    img.addEventListener('click', () => {
      document.body.appendChild(lightbox); // Ensures it sits above CMS headers
      lightboxImg.src = img.dataset.fullsize || img.src;
      lightboxImg.alt = img.alt ? `Full Size: ${img.alt}` : 'Full Size version of the photo.';
      lightbox.style.display = 'block';
      lightbox.scrollTop = 0;
      lightbox.scrollLeft = 0;
      document.body.style.overflow = 'hidden';
    });
  });

  // Close handlers
  const closeLightbox = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  };

  lightbox.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'block') {
      closeLightbox();
    }
  });
});