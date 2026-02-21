// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAfaVfpgWBP0l1xnt0s91mR2C6mSWAam6U",
  authDomain: "luo-city-spa-club-836bf.firebaseapp.com",
  projectId: "luo-city-spa-club-836bf",
  storageBucket: "luo-city-spa-club-836bf.firebasestorage.app",
  messagingSenderId: "25443267460",
  appId: "1:25443267460:web:d345d5227187b6716da3d1",
  measurementId: "G-P857NTSPJ2",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Get localized content from Firebase item (handles multiple languages)
const getLocalized = (item, fieldName) => {
  if (!item || !fieldName) return "";
  // Get current language from i18next
  const lang = (
    i18next?.language ||
    localStorage.getItem("userLanguage") ||
    "en"
  ).substring(0, 2);
  // Check for language-specific field first (title_en, title_zh, etc.)
  if (item[`${fieldName}_${lang}`]) {
    return item[`${fieldName}_${lang}`];
  }
  // Fallback to original field for backward compatibility
  if (item[fieldName]) {
    return item[fieldName];
  }
  // Last resort fallback to _en version
  if (item[`${fieldName}_en`]) {
    return item[`${fieldName}_en`];
  }
  return "";
};

// 1. Service Card
const createServiceCard = (item) => {
  const imgUrl =
    item.image && item.image.length > 5
      ? item.image
      : "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  const title = getLocalized(item, "title");
  const description = getLocalized(item, "description");
  const bookNowText = i18next?.t("buttons.bookNow") || "Book Now";
  return `
    <div class="card">
        <img src="${imgUrl}" alt="${escapeHtml(title)}" class="service-card-img">
        <div class="service-content">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
            <a href="contact.html" class="service-link">${bookNowText} <i class="fas fa-arrow-right"></i></a>
        </div>
    </div>`;
};

// 2. Photo Card
const createPhotoCard = (item) => {
  // For better SEO, consider adding a 'title' or 'description' to your gallery items in Firebase
  const altText =
    getLocalized(item, "title") ||
    i18next?.t("gallery.photoAlt", "Luo City Spa Gallery Image");
  const safeUrl = item.url ? item.url.replace(/'/g, "\\'") : "";
  return `
    <div class="card gallery-item" onclick="openLightbox('${safeUrl}')">
        <img src="${item.url}" alt="${escapeHtml(altText)}" class="gallery-img">
        <div class="zoom-icon"><i class="fas fa-search-plus"></i></div>
    </div>`;
};

// 3. Video Card
const createVideoCard = (item) => {
  if (!item || !item.url) return "";
  const title =
    getLocalized(item, "title") ||
    i18next?.t("gallery.videoFallback") ||
    "Video";

  let embedUrl = item.url;

  // 1. Handle TikTok URLs
  if (item.url.includes("tiktok.com") && item.url.includes("/video/")) {
    const match = item.url.match(/video\/(\d+)/);
    if (match && match[1]) {
      embedUrl = `https://www.tiktok.com/embed/v2/${match[1]}?lang=en-US&auto_play=1`;
    }
  }
  // 2. Handle Standard YouTube URLs (convert watch?v= to embed/)
  else if (item.url.includes("youtube.com/watch")) {
    try {
      const urlObj = new URL(item.url);
      const v = urlObj.searchParams.get("v");
      if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
    } catch (e) {}
  }

  return `
    <div class="card">
        <div class="video-wrapper"><iframe src="${embedUrl}" title="${escapeHtml(title)}" frameborder="0" allowfullscreen></iframe></div>
        <div style="padding:15px;"><h4>${escapeHtml(title)}</h4></div>
    </div>`;
};

// 3.1 TikTok Card (Portrait)
const createTikTokCard = (item) => {
  if (!item || !item.url) return "";
  const title =
    getLocalized(item, "title") ||
    i18next?.t("gallery.videoFallback") ||
    "Video";

  let embedUrl = item.url;
  if (item.url.includes("tiktok.com") && item.url.includes("/video/")) {
    const match = item.url.match(/video\/(\d+)/);
    if (match && match[1]) {
      embedUrl = `https://www.tiktok.com/embed/v2/${match[1]}?lang=en-US&auto_play=1`;
    }
  }

  return `
    <div class="card" style="background: transparent; border: none; box-shadow: none;">
        <div class="video-wrapper-portrait" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"><iframe src="${embedUrl}" title="${escapeHtml(title)}" frameborder="0" allowfullscreen scrolling="no"></iframe></div>
    </div>`;
};

// 4. Social Card
const createSocialCard = (item) => {
  const content = getLocalized(item, "content");
  const brandName = i18next?.t("social.brand") || "Luo City Spa";
  const lang = i18next?.language || "en";
  const WrapperStart = item.link
    ? `<a href="${item.link}" target="_blank" style="text-decoration:none; color:inherit; display:block; height:100%;">`
    : `<div style="height:100%;">`;
  const WrapperEnd = item.link ? `</a>` : `</div>`;
  const HoverClass = item.link ? `social-hover` : ``;
  // Generate alt text from the first 50 characters of the content
  const altText = content.substring(0, 50) + "...";

  // Truncate content if too long
  const MAX_LENGTH = 50;
  let displayContent = escapeHtml(content);
  if (content.length > MAX_LENGTH) {
    displayContent =
      escapeHtml(content.substring(0, MAX_LENGTH)) +
      `... <span style="color:var(--secondary); font-weight:bold;">See More</span>`;
  }

  return `
    <div class="card social-card ${HoverClass}">
        ${WrapperStart}
        <div class="social-header">
            <div class="avatar"><i class="fas fa-spa"></i></div>
            <div>
                <strong>${escapeHtml(brandName)}</strong>
                ${item.link ? '<i class="fas fa-external-link-alt" style="font-size:0.7rem; color:var(--secondary); margin-left:5px;"></i>' : ""}
                <br><small>${new Date(item.date).toLocaleDateString(lang)}</small>
            </div>
        </div>
        <p>${displayContent}</p>
        ${item.image ? `<img src="${item.image}" alt="${escapeHtml(altText)}" class="social-img">` : ""}
        ${WrapperEnd}
    </div>`;
};

// 5. Membership Card
const createMembershipCard = (item) => {
  const name = getLocalized(item, "name");
  const recharge = getLocalized(item, "recharge");
  const benefits = getLocalized(item, "benefits") || "";

  // Auto-assign local images if not provided, based on card name
  let imgUrl = item.image;
  if (!imgUrl && name) {
    const lower = name.toLowerCase();
    if (lower.includes("black")) imgUrl = "images/black_card.png";
    else if (lower.includes("green")) imgUrl = "images/green_card.png";
    else if (
      lower.includes("silver") ||
      lower.includes("newer") ||
      lower.includes("experience")
    )
      imgUrl = "images/newer_card.png";
  }

  const benefitsList = benefits
    .split("\n")
    .filter((b) => b.trim() !== "")
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");

  return `
    <div class="card">
        <div class="card-content membership-card-content">
            ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(name)}" class="membership-img">` : ""}
            <h3>${escapeHtml(name)}</h3>
            <p class="membership-recharge">${escapeHtml(recharge)}</p>
            <ul class="membership-benefits">
                ${benefitsList}
            </ul>
        </div>
    </div>`;
};

// ==========================================
// 3. UI LOGIC (Slideshow, Lightbox, Loader)
// ==========================================

// Slideshow Logic
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

// Lightbox Logic
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

// ==========================================
// 4. DATA LOADING (Main Logic)
// ==========================================
function loadContent() {
  // 1. LOAD BANNERS
  const heroSlideshow = document.getElementById("hero-slideshow");
  if (heroSlideshow) {
    db.ref("banners").on("value", (snap) => {
      const val = snap.val();
      if (val) {
        const data = Object.values(val);
        heroSlideshow.innerHTML = data
          .map((item, index) => {
            // For SEO, add a 'title' to your banner data in Firebase to be used as alt text.
            const altText =
              getLocalized(item, "title") ||
              i18next.t("hero.alt", "Luo City Spa Promotion");
            return `
                    <div class="hero-slide ${index === 0 ? "active" : ""}" style="background-image: url('${item.url}');" role="img" aria-label="${escapeHtml(altText)}"></div>
                `;
          })
          .join("");
        startSlideshow();
      } else {
        heroSlideshow.innerHTML = `<div class="hero-slide active" style="background-image: url('https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');"></div>`;
      }
    });
  }

  // 2. LOAD SERVICES
  const serviceGrid = document.getElementById("services-grid");
  const homeServiceGrid = document.getElementById("home-services-grid");

  if (serviceGrid || homeServiceGrid) {
    db.ref("services").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];

      // Services Page (Show All)
      if (serviceGrid) {
        serviceGrid.innerHTML =
          data.length > 0
            ? data.map(createServiceCard).join("")
            : `<p style="grid-column:1/-1; text-align:center;">${i18next.t("messages.noServices", "No services added yet.")}</p>`;
      }

      // Home Page (Show 3)
      const isHome = document.getElementById("home-page-marker");
      if (isHome && serviceGrid) {
        serviceGrid.innerHTML =
          data.length > 0
            ? data.slice(0, 3).map(createServiceCard).join("")
            : `<p style="grid-column:1/-1; text-align:center;">${i18next.t("messages.noServices", "No services added yet.")}</p>`;
      }
      if (homeServiceGrid) {
        homeServiceGrid.innerHTML =
          data.length > 0
            ? data.slice(0, 3).map(createServiceCard).join("")
            : `<p style="grid-column:1/-1; text-align:center;">${i18next.t("messages.noServices", "No services added yet.")}</p>`;
      }
    });
  }

  // 3. LOAD GALLERY
  const galleryGrid = document.getElementById("gallery-grid");
  if (galleryGrid) {
    db.ref("gallery").on("value", (snap) => {
      const val = snap.val();
      const data = val
        ? Object.values(val)
            .reverse()
            .filter((item) => {
              if (!item.url) return false;
              const u = (item.url || "").toLowerCase();
              return (
                !u.includes("youtube") &&
                !u.includes("youtu.be") &&
                !u.includes("vimeo")
              );
            })
        : [];

      const isHome = document.getElementById("home-page-marker");

      if (isHome) {
        const displayData = data.slice(0, 3);
        galleryGrid.innerHTML =
          displayData.map(createPhotoCard).join("") ||
          `<p>${i18next.t("messages.noPhotos", "No photos yet.")}</p>`;
        if (data.length > 3) {
          const btn = document.getElementById("gallery-more-btn");
          if (btn) btn.classList.remove("hide");
        }
      } else {
        // Show all photos on the gallery page
        galleryGrid.innerHTML =
          data.map(createPhotoCard).join("") ||
          `<p>${i18next.t("messages.noPhotos", "No photos yet.")}</p>`;
        const container = document.getElementById("gallery-more-container");
        if (container) container.innerHTML = "";
      }
    });
  }

  // 4. LOAD VIDEOS
  const videoGrid = document.getElementById("video-grid");
  const youtubeGrid = document.getElementById("youtube-grid");
  const tiktokGrid = document.getElementById("tiktok-grid");

  if (videoGrid || (youtubeGrid && tiktokGrid)) {
    db.ref("videos").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val).reverse() : [];

      if (youtubeGrid && tiktokGrid) {
        const ytData = data.filter(
          (item) => item.url && !item.url.includes("tiktok.com"),
        );
        const ttData = data.filter(
          (item) => item.url && item.url.includes("tiktok.com"),
        );

        const updateYT = (showAll) => {
          const display = showAll ? ytData : ytData.slice(0, 3);
          youtubeGrid.innerHTML =
            display.map(createVideoCard).join("") ||
            `<p>${i18next.t("messages.noVideos", "No videos yet.")}</p>`;
          const container = document.getElementById("youtube-more-container");
          if (container) {
            if (ytData.length > 3 && !showAll) {
              container.innerHTML = `<button class="btn-outline" id="yt-see-more-btn">See More</button>`;
              document
                .getElementById("yt-see-more-btn")
                .addEventListener("click", () => updateYT(true));
            } else {
              container.innerHTML = "";
            }
          }
        };
        updateYT(false);

        const updateTT = (showAll) => {
          const display = showAll ? ttData : ttData.slice(0, 3);
          tiktokGrid.innerHTML =
            display.map(createTikTokCard).join("") ||
            `<p>${i18next.t("messages.noVideos", "No videos yet.")}</p>`;
          const container = document.getElementById("tiktok-more-container");
          if (container) {
            if (ttData.length > 3 && !showAll) {
              container.innerHTML = `<button class="btn-outline" id="tt-see-more-btn">See More</button>`;
              document
                .getElementById("tt-see-more-btn")
                .addEventListener("click", () => updateTT(true));
            } else {
              container.innerHTML = "";
            }
          }
        };
        updateTT(false);
      } else if (videoGrid) {
        videoGrid.innerHTML =
          data.map(createVideoCard).join("") ||
          `<p>${i18next.t("messages.noVideos", "No videos yet.")}</p>`;
      }
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
        displayData.map(createSocialCard).join("") ||
        `<p>${i18next.t("messages.noUpdates", "No updates yet.")}</p>`;

      if (isHome && data.length > 3) {
        const btn = document.getElementById("social-more-btn");
        if (btn) btn.classList.remove("hide");
      }
    });
  }

  // 7. LOAD MEMBERSHIPS
  const membershipGrid = document.getElementById("membership-grid");
  if (membershipGrid) {
    db.ref("memberships").on("value", (snap) => {
      const val = snap.val();
      const data = val ? Object.values(val) : [];
      membershipGrid.innerHTML =
        data.map(createMembershipCard).join("") ||
        `<p style="grid-column:1/-1; text-align:center;">${i18next.t("messages.noMemberships", "No memberships found.")}</p>`;
    });
  }

  // 6. LOAD SEO
  db.ref("settings/seo").on("value", (snap) => {
    const val = snap.val();
    if (val) {
      // 1. Identify Current Page (e.g., 'home', 'about', 'services')
      let path = window.location.pathname;
      // Handle trailing slash (e.g. /about/ -> /about)
      if (path.endsWith("/") && path.length > 1) {
        path = path.slice(0, -1);
      }
      let pageKey = path.split("/").pop().split("?")[0].replace(".html", "");
      if (!pageKey || pageKey === "index" || pageKey === "") pageKey = "home";

      // 2. Merge Global Settings with Page-Specific Settings
      // Logic Update: Prioritize page-specific settings.
      // Only use global title for home page to prevent overwriting static titles on subpages.
      let finalTitle = null;
      let finalDesc = getLocalized(val, "description") || "";
      let finalKeywords = getLocalized(val, "keywords") || "";
      let finalImage = val.image || "";

      if (val.pages && val.pages[pageKey]) {
        const p = val.pages[pageKey];
        const pTitle = getLocalized(p, "title");
        if (pTitle) finalTitle = pTitle;

        const pDesc = getLocalized(p, "description");
        if (pDesc) finalDesc = pDesc;

        const pKeywords = getLocalized(p, "keywords");
        if (pKeywords) finalKeywords = pKeywords;

        if (p.image) finalImage = p.image;
      }

      // If no page-specific title, and it's the home page, use global title
      if (!finalTitle && pageKey === "home") {
        finalTitle = getLocalized(val, "title");
      }

      // 1. Set Browser Title
      if (finalTitle) document.title = finalTitle;

      // 2. Helper function to update or create meta tags
      const setMeta = (name, content, attr = "name") => {
        let meta = document.querySelector(`meta[${attr}="${name}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute(attr, name);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      // 3. Standard SEO
      setMeta("description", finalDesc);
      setMeta("keywords", finalKeywords);

      // 4. Open Graph (Facebook, LinkedIn, WhatsApp)
      setMeta("og:title", finalTitle || document.title, "property");
      setMeta("og:description", finalDesc, "property");
      setMeta("og:type", "website", "property");
      setMeta("og:url", window.location.href, "property");
      if (finalImage) setMeta("og:image", finalImage, "property");

      // 5. Twitter Cards
      setMeta("twitter:card", "summary_large_image");
      setMeta("twitter:title", finalTitle || document.title);
      setMeta("twitter:description", finalDesc);
      if (finalImage) setMeta("twitter:image", finalImage);
    }
  });
}

// ==========================================
// 4. LANGUAGE CHANGE HANDLER
// ==========================================
// Listen for language changes and re-render all content
if (typeof i18next !== "undefined") {
  i18next.on("languageChanged", (lng) => {
    console.log("App: Language changed to", lng);
    // Re-render all dynamically loaded content
    loadContent();
    // Update all language-specific buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-lang") === lng) {
        btn.classList.add("active");
      }
    });
  });
}

// ==========================================
// 5. AI CHATBOT LOGIC (Groq API via Netlify Function)
// ==========================================
// API key is now handled securely by Netlify Function on the server
// No sensitive data is exposed to the client
const GROQ_MODEL = "llama-3.1-8b-instant";

let chatbotSettings = null;
let chatHistory = [];

// Load chatbot prompt from Firebase
db.ref("settings/chatbot").on("value", (snap) => {
  chatbotSettings = snap.val();
});

function initChatWidget() {
  if (window.location.pathname.includes("admin.html")) return;

  // Use hardcoded English fallbacks. The data-i18n attributes will be
  // correctly translated by updatePageLanguage() after the widget is injected.
  const title = "Luo City Assistant";
  const welcome = "Hello! How can I help you today?";
  const typing = "Typing...";
  const tooltipText = "Chat here!";

  const html = `
        <div class="chat-widget-btn" onclick="toggleChat()">
            <i class="fas fa-comments"></i>
            <span class="chat-tooltip" id="chat-tooltip" data-i18n="chatbot.tooltip">${escapeHtml(tooltipText)}</span>
        </div>
        <div class="chat-window" id="chat-window">
            <div class="chat-header">
                <span data-i18n="chatbot.title">${escapeHtml(title)}</span>
                <i class="fas fa-times" style="cursor:pointer;" onclick="toggleChat()"></i>
            </div>
            <div class="chat-body" id="chat-body">
                <div class="chat-message bot" data-i18n="chatbot.welcome">${escapeHtml(welcome)}</div>
            </div>
            <div class="typing-indicator" id="typing-indicator" data-i18n="chatbot.typing">${escapeHtml(typing)}</div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" data-i18n="[placeholder]chatbot.placeholder" placeholder="Ask a question..." onkeypress="handleChatKey(event)">
                <button class="btn" style="padding: 8px 15px; border-radius: 50%;" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);

  // Translate the newly injected widget elements
  if (typeof updatePageLanguage === "function") {
    updatePageLanguage();
  }

  // Show tooltip animation after 2 seconds
  setTimeout(() => {
    const tooltip = document.getElementById("chat-tooltip");
    if (
      tooltip &&
      !document.getElementById("chat-window").classList.contains("active")
    ) {
      tooltip.classList.add("show");
    }
  }, 2000);

  // Click outside to close
  document.addEventListener("click", (e) => {
    const chatWindow = document.getElementById("chat-window");
    const chatBtn = document.querySelector(".chat-widget-btn");
    if (chatWindow && chatWindow.classList.contains("active")) {
      if (!chatWindow.contains(e.target) && !chatBtn.contains(e.target)) {
        toggleChat();
      }
    }
  });

  // Restore chat history from sessionStorage
  const savedHistory = sessionStorage.getItem("chatHistory");
  if (savedHistory) {
    try {
      chatHistory = JSON.parse(savedHistory);
      chatHistory.forEach((msg) => {
        const text =
          msg.parts && msg.parts[0] ? msg.parts[0].text : msg.content;
        const sender = msg.role === "model" ? "bot" : "user";
        addMessage(text, sender);
      });
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }
}

function toggleChat() {
  const win = document.getElementById("chat-window");
  const tooltip = document.getElementById("chat-tooltip");
  win.classList.toggle("active");

  // Hide tooltip when chat is opened
  if (win.classList.contains("active") && tooltip) {
    tooltip.classList.remove("show");
  }
}

function handleChatKey(e) {
  if (e.key === "Enter") sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  // 1. Update UI and History immediately for User
  addMessage(msg, "user");
  chatHistory.push({ role: "user", parts: [{ text: msg }] });
  sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));

  input.value = "";
  document.getElementById("typing-indicator").style.display = "block";

  try {
    const currentLangCode = (i18next.language || "en").substring(0, 2);
    const langMap = {
      en: "English",
      zh: "Chinese (Simplified)",
      ko: "Korean",
      jp: "Japanese",
    };
    const targetLang = langMap[currentLangCode] || "English";

    const basePrompt =
      getLocalized(chatbotSettings, "prompt") ||
      i18next.t(
        "chatbot.systemContext",
        "You are a helpful AI assistant for Luo City Spa Club. Please call +63-999-816-8888 for assistance.",
      );

    const SPA_CONTEXT = `${basePrompt}\n\n---RULES---\n1. CRITICAL: Reply to the user in ${targetLang}.\n2. CRITICAL: Keep all answers short and concise, under 50 words if possible.`;

    // FIX: Remove chat history from API request to prevent 413 Token Limit errors.
    // We only send the System Prompt and the Current Message.
    let safeMsg = msg;
    if (safeMsg.length > 1000)
      safeMsg = safeMsg.substring(0, 1000) + "...(truncated)";

    const messages = [
      { role: "system", content: SPA_CONTEXT },
      { role: "user", content: safeMsg },
    ];

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    // Use local dev server for testing, otherwise use the production Netlify function
    const apiUrl = isLocal
      ? "http://localhost:8888/.netlify/functions/chatbot"
      : "/.netlify/functions/chatbot";

    console.log("Chatbot sending request to:", apiUrl);

    // Call Netlify Function (which proxies to Groq API securely)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(
        `API Error: ${response.status} - ${data.error || "Unknown"}`,
      );
    }

    console.log("Chatbot Response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response from API");
    }

    const botReply = data.choices[0].message.content;

    // Add bot reply to history and display
    chatHistory.push({ role: "model", parts: [{ text: botReply }] });
    addMessage(botReply, "bot");

    // Save to sessionStorage
    sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  } catch (error) {
    console.error("Chatbot Error:", error);
    addMessage(
      i18next.t(
        "chatbot.error",
        "I am having trouble connecting right now. Please call our front desk at +63-999-816-8888.",
      ),
      "bot",
    );
  } finally {
    document.getElementById("typing-indicator").style.display = "none";
  }
}

function addMessage(text, sender) {
  const body = document.getElementById("chat-body");
  const div = document.createElement("div");
  div.className = `chat-message ${sender}`;
  div.innerText = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

// ==========================================
// 6. CONTACT FORM (EmailJS)
// ==========================================
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // Initialize EmailJS (Replace with your actual Public Key)
  // Ensure <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script> is in your HTML
  if (typeof emailjs !== "undefined") {
    emailjs.init("95k_Fj2kWAzLVmsKe");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']");
    const originalText = btn ? btn.innerText : "Submit";

    if (btn) {
      btn.innerText = i18next?.t("buttons.loading") || "Sending...";
      btn.disabled = true;
    }

    // Populate hidden time field for the template
    const timeField = document.getElementById("contact-time");
    if (timeField) timeField.value = new Date().toLocaleString();

    const serviceID = "service_0184vmu";
    const templateID = "template_dgpuiqk";

    if (typeof emailjs === "undefined") {
      alert("Error: EmailJS SDK not loaded.");
      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
      return;
    }

    emailjs
      .sendForm(serviceID, templateID, this)
      .then(
        () => {
          alert("Message sent successfully!");
          form.reset();
        },
        (err) => {
          console.error("EmailJS Error:", err);
          alert("Failed to send message. Please try again.");
        },
      )
      .finally(() => {
        if (btn) {
          btn.innerText = originalText;
          btn.disabled = false;
        }
      });
  });
}

// ==========================================
// 7. INITIALIZATION & EVENTS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (menuToggle && navLinks) {
    // Fix: Remove inline onclick if present to prevent double-toggling
    menuToggle.removeAttribute("onclick");
    menuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle("active");
    });
  }

  // Gallery Dropdown
  const galleryDropdown = document.querySelector(".nav-item-dropdown");
  if (galleryDropdown) {
    const toggleLink = galleryDropdown.querySelector("a[href='gallery.html']");
    if (toggleLink) {
      toggleLink.addEventListener("click", (e) => {
        // On mobile, toggle dropdown. On desktop, allow navigation.
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          e.preventDefault();
          e.stopPropagation();
          galleryDropdown.classList.toggle("open");
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!galleryDropdown.contains(e.target)) {
        galleryDropdown.classList.remove("open");
      }
    });
  }

  // Loader & Lightbox Injection
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

  // Smooth Links
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (this.closest(".nav-item-dropdown") && href === "gallery.html") return;
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        !href.startsWith("mailto") &&
        !href.startsWith("tel:") &&
        !href.startsWith("sms:")
      ) {
        e.preventDefault();
        if (loader) loader.classList.remove("loader-hidden");
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });

  // Start Chat
  initChatWidget();

  // Contact Form
  initContactForm();
});
