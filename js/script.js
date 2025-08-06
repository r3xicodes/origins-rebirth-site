let currentSlide = 0;
const slides = document.querySelectorAll('.background-carousel .slide');
const slideInterval = 7000; // 7 seconds

function showNextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

setInterval(showNextSlide, slideInterval);
