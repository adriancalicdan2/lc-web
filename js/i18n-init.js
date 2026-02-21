// i18n Initialization Script
// This must load BEFORE script.js

const I18N_LANGUAGES = {
  en: { name: "English" },
  jp: { name: "日本語" },
  zh: { name: "中文" },
  ko: { name: "한국어" },
};

// Use i18next-http-backend for loading JSON files
i18next
  .use({
    type: "backend",
    init: function () {},
    read: function (language, namespace, callback) {
      fetch(`locales/${language}.json`)
        .then((res) => res.json())
        .then((data) => callback(null, data))
        .catch((err) => callback(err));
    },
  })
  .init(
    {
      lng: localStorage.getItem("userLanguage") || "en",
      fallbackLng: "en",
      load: "languageOnly", // Forces en-US to be en
      ns: ["translation"],
      defaultNS: "translation",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    },
    function (err, t) {
      if (err) {
        console.error("i18next initialization error:", err);
      } else {
        console.log("i18next initialized successfully");
        updatePageLanguage();
        createLanguageDropdown();
        // Trigger dynamic content load now that translations are ready
        if (typeof loadContent === "function") {
          loadContent();
        }
      }
    },
  );

// Function to update all data-i18n elements
function updatePageLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");

    // Handle [placeholder]key syntax
    if (key.startsWith("[placeholder]")) {
      const actualKey = key.replace("[placeholder]", "");
      const translatedText = i18next.t(actualKey);
      element.setAttribute("placeholder", translatedText);
    } else if (key.startsWith("[")) {
      // Handle other bracket syntaxes if needed
      const match = key.match(/\[(\w+)\](.+)/);
      if (match) {
        const attrName = match[1];
        const actualKey = match[2];
        const translatedText = i18next.t(actualKey);
        element.setAttribute(attrName, translatedText);
      }
    } else {
      // Regular text translation
      const translatedText = i18next.t(key);
      element.textContent = translatedText;
    }
  });
}

// Listen for language changes
i18next.on("languageChanged", (lng) => {
  console.log("Language changed to:", lng);
  localStorage.setItem("userLanguage", lng);

  // Update dropdown display
  const dropdown = document.getElementById("language-dropdown");
  if (dropdown) {
    const langCode = lng.substring(0, 2);
    const selectedSpan = dropdown.querySelector(".lang-selected span");
    if (selectedSpan) selectedSpan.textContent = langCode.toUpperCase();

    // Update active class in options list
    dropdown.querySelectorAll(".lang-options li").forEach((li) => {
      li.classList.remove("active");
    });
    const activeLi = dropdown.querySelector(`li[data-lang="${langCode}"]`);
    if (activeLi) activeLi.classList.add("active");
  }

  updatePageLanguage();
});

// Function to change language (called by language selector)
function changeLanguage(lng) {
  i18next.changeLanguage(lng, (err, t) => {
    if (!err) {
      console.log("Language changed successfully to:", lng);
      // If script.js is loaded, trigger content reload
      if (typeof loadContent === "function") {
        loadContent();
      }
    } else {
      console.error("Language change error:", err);
    }
  });
}

function createLanguageDropdown() {
  const selectorContainer = document.querySelector(".language-selector");
  // Only run if the container exists and dropdown hasn't been created
  if (!selectorContainer || document.getElementById("language-dropdown"))
    return;

  const currentLang = i18next.language.substring(0, 2);

  const dropdownHTML = `
      <div class="language-dropdown" id="language-dropdown">
          <div class="lang-selected" aria-haspopup="true" aria-expanded="false" tabindex="0">
              <span>${currentLang.toUpperCase()}</span>
              <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </div>
          <ul class="lang-options" role="menu">
              ${Object.keys(I18N_LANGUAGES)
                .map(
                  (langCode) => `
                  <li data-lang="${langCode}" role="menuitem" tabindex="-1">
                      <span>${I18N_LANGUAGES[langCode].name}</span>
                  </li>
              `,
                )
                .join("")}
          </ul>
      </div>
  `;

  // Hide old selector (if it has button children) and insert new one
  if (selectorContainer.querySelector(".lang-btn")) {
    selectorContainer.style.display = "none";
  }
  selectorContainer.insertAdjacentHTML("afterend", dropdownHTML);

  const dropdown = document.getElementById("language-dropdown");
  const selected = dropdown.querySelector(".lang-selected");

  // Set initial active state in the options list
  const activeLi = dropdown.querySelector(
    `.lang-options li[data-lang="${currentLang}"]`,
  );
  if (activeLi) {
    activeLi.classList.add("active");
  }
  selected.addEventListener("click", () => dropdown.classList.toggle("open"));

  dropdown.querySelectorAll(".lang-options li").forEach((option) => {
    option.addEventListener("click", () => changeLanguage(option.dataset.lang));
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });
}

// Ensure localStorage key exists
if (!localStorage.getItem("userLanguage")) {
  localStorage.setItem("userLanguage", "en");
}
