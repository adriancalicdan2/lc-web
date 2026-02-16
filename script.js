// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAfaVfpgWBP0l1xnt0s91mR2C6mSWAam6U",
  authDomain: "luo-city-spa-club-836bf.firebaseapp.com",
  projectId: "luo-city-spa-club-836bf",
  storageBucket: "luo-city-spa-club-836bf.firebasestorage.app",
  messagingSenderId: "25443267460",
  appId: "1:25443267460:web:d345d5227187b6716da3d1",
  measurementId: "G-P857NTSPJ2",
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// --- CARD CREATION HELPERS ---

// 1. Service Card (Post Card Style)
const createServiceCard = (item) => {
  const imgUrl =
    item.image && item.image.length > 5
      ? item.image
      : "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  return `
    <div class="card">
        <img src="${imgUrl}" class="service-card-img" style="width:100%; height:250px; object-fit:cover; border-bottom:4px solid var(--secondary);">
        <div class="service-content" style="padding:25px; text-align:left;">
            <h3 style="font-size:1.5rem; margin-bottom:12px; color:var(--primary);">${item.title}</h3>
            <p style="color:#666; font-size:1rem; line-height:1.6; margin-bottom:15px;">${item.description}</p>
            <a href="contact.html" style="color:var(--secondary); font-weight:bold; text-decoration:none; text-transform:uppercase; font-size:0.8rem;">Book Now <i class="fas fa-arrow-right"></i></a>
        </div>
    </div>`;
};

// 2. Photo Card
const createPhotoCard = (item) => `
    <div class="card gallery-item" onclick="openLightbox('${item.url}')">
        <img src="${item.url}" class="gallery-img">
        <div class="zoom-icon"><i class="fas fa-search-plus"></i></div>
    </div>`;

// 3. Video Card
const createVideoCard = (item) => `
    <div class="card">
        <div class="video-wrapper"><iframe src="${item.url}" frameborder="0" allowfullscreen></iframe></div>
        <div style="padding:15px;"><h4>${item.title || "Video"}</h4></div>
    </div>`;

// 4. Social Card
const createSocialCard = (item) => {
  const WrapperStart = item.link
    ? `<a href="${item.link}" target="_blank" style="text-decoration:none; color:inherit; display:block; height:100%;">`
    : `<div style="height:100%;">`;
  const WrapperEnd = item.link ? `</a>` : `</div>`;
  const HoverClass = item.link ? `social-hover` : ``;

  return `
    <div class="card social-card ${HoverClass}">
        ${WrapperStart}
        <div class="social-header">
            <div class="avatar"><i class="fas fa-spa"></i></div>
            <div>
                <strong>Luo City Spa</strong>
                ${item.link ? '<i class="fas fa-external-link-alt" style="font-size:0.7rem; color:var(--secondary); margin-left:5px;"></i>' : ""}
                <br><small>${new Date(item.date).toLocaleDateString()}</small>
            </div>
        </div>
        <p>${item.content}</p>
        ${item.image ? `<img src="${item.image}" class="social-img">` : ""}
        ${WrapperEnd}
    </div>`;
};

// --- SLIDESHOW LOGIC (NEW) ---
let slideInterval;
function startSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length <= 1) return;

  let currentSlide = 0;
  if (slideInterval) clearInterval(slideInterval);

  slideInterval = setInterval(() => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 5000);
}

// --- LIGHTBOX LOGIC ---
function openLightbox(url) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    document.getElementById("lightbox-img").src = url;
    lightbox.classList.add("active");
  }
}
function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.classList.remove("active");
}

// --- MAIN LOAD FUNCTION ---
function loadContent() {
  // 1. LOAD BANNERS (Slideshow)
  const heroSlideshow = document.getElementById("hero-slideshow");
  if (heroSlideshow) {
    db.ref("banners").on("value", (snap) => {
      const val = snap.val();
      if (val) {
        const data = Object.values(val);
        heroSlideshow.innerHTML = data
          .map(
            (item, index) => `
                    <div class="hero-slide ${index === 0 ? "active" : ""}" style="background-image: url('${item.url}');"></div>
                `,
          )
          .join("");
        startSlideshow();
      } else {
        heroSlideshow.innerHTML = `<div class="hero-slide active" style="background-image: url('https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');"></div>`;
      }
    });
  }

  // 2. LOAD SERVICES (Handles BOTH Home and Services Page)
  const serviceGrid = document.getElementById("services-grid");
  const homeServiceGrid = document.getElementById("home-services-grid"); // RESTORED YOUR ID

  // We check if EITHER grid exists to avoid running this if not needed
  if (serviceGrid || homeServiceGrid) {
    db.ref("services").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];

      // If on Services Page (Show ALL)
      if (serviceGrid) {
        serviceGrid.innerHTML =
          data.length > 0
            ? data.map(createServiceCard).join("")
            : '<p style="grid-column:1/-1; text-align:center;">No services added yet.</p>';
      }

      // If on Home Page (Show 3)
      // Note: In index.html, ensure your grid ID matches one of these!
      // My previous instruction said id="services-grid", but if you used id="home-services-grid", this fixes it.
      // If you use "services-grid" on home, we limit it if 'home-page-marker' exists.
      const isHome = document.getElementById("home-page-marker");
      if (isHome && serviceGrid) {
        serviceGrid.innerHTML =
          data.length > 0
            ? data.slice(0, 3).map(createServiceCard).join("")
            : '<p style="grid-column:1/-1; text-align:center;">No services added yet.</p>';
      }
      // Compatibility for your old ID
      if (homeServiceGrid) {
        homeServiceGrid.innerHTML =
          data.length > 0
            ? data.slice(0, 3).map(createServiceCard).join("")
            : '<p style="grid-column:1/-1; text-align:center;">No services added yet.</p>';
      }
    });
  }

  // 3. LOAD GALLERY
  const galleryGrid = document.getElementById("gallery-grid");
  if (galleryGrid) {
    db.ref("gallery").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];
      const isHome = document.getElementById("home-page-marker");
      const displayData = isHome ? data.slice(0, 3) : data;

      galleryGrid.innerHTML =
        displayData.map(createPhotoCard).join("") || "<p>No photos yet.</p>";

      if (isHome && data.length > 3) {
        const btn = document.getElementById("gallery-more-btn");
        if (btn) btn.classList.remove("hide");
      }
    });
  }

  // 4. LOAD VIDEOS
  const videoGrid = document.getElementById("video-grid");
  if (videoGrid) {
    db.ref("videos").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];
      videoGrid.innerHTML =
        data.map(createVideoCard).join("") || "<p>No videos yet.</p>";
    });
  }

  // 5. LOAD SOCIAL
  const socialGrid = document.getElementById("social-grid");
  if (socialGrid) {
    db.ref("social").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];
      const isHome = document.getElementById("home-page-marker");
      const displayData = isHome ? data.slice(0, 3) : data;

      socialGrid.innerHTML =
        displayData.map(createSocialCard).join("") || "<p>No updates yet.</p>";

      if (isHome && data.length > 3) {
        const btn = document.getElementById("social-more-btn");
        if (btn) btn.classList.remove("hide");
      }
    });
  }
}

// --- INITIALIZE & MOBILE MENU ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Menu Logic (RESTORED)
  const menuToggle = document.querySelector(".menu-toggle"); // Adjusted selector to match standard class
  const navLinks = document.querySelector(".nav-links");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // 1b. Gallery dropdown toggle (click-based on all devices)
  const galleryDropdown = document.querySelector(".nav-item-dropdown");
  if (galleryDropdown) {
    const toggleLink = galleryDropdown.querySelector("a[href='gallery.html']");
    if (toggleLink) {
      toggleLink.addEventListener("click", (e) => {
        // prevent navigation to gallery when clicking the toggle itself
        e.preventDefault();
        e.stopPropagation();
        // close if already open, otherwise open and close any other dropdowns
        const isOpen = galleryDropdown.classList.contains("open");
        document
          .querySelectorAll(".nav-item-dropdown.open")
          .forEach((el) => el.classList.remove("open"));
        if (!isOpen) {
          galleryDropdown.classList.add("open");
        }
      });
    }

    // close dropdown when clicking anywhere else on the document
    document.addEventListener("click", (e) => {
      if (!galleryDropdown.contains(e.target)) {
        galleryDropdown.classList.remove("open");
      }
    });
  }

  // 2. Inject Loader & Lightbox
  const htmlToInject = `
        <div class="loader-wrapper" id="page-loader"><div class="spinner"></div></div>
        <div id="lightbox" class="lightbox" onclick="closeLightbox()">
            <span class="close-lightbox">×</span>
            <img class="lightbox-content" id="lightbox-img">
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", htmlToInject);

  const loader = document.getElementById("page-loader");

  window.addEventListener("load", () => {
    loadContent();
    setTimeout(() => {
      if (loader) loader.classList.add("loader-hidden");
    }, 600);
  });

  // 3. Smooth Link Transition
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Skip smooth-transition handling for gallery dropdown toggle
      if (
        this.closest(".nav-item-dropdown") &&
        href === "gallery.html"
      ) {
        return; // let the toggle handler control behavior
      }

      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        !href.startsWith("mailto")
      ) {
        e.preventDefault();
        if (loader) loader.classList.remove("loader-hidden");
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });
});
