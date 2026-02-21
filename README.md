# Luo City Spa Club Website

A modern, responsive, and internationalized static website for Luo City Spa Club, featuring dynamic content management via Firebase and an AI-powered chatbot.

## Overview

This project is a multi-page website designed to showcase the services, facilities, and updates of Luo City Spa Club. It includes a comprehensive Admin Dashboard that allows non-technical staff to update content (banners, services, gallery, etc.) in real-time without modifying code. The site supports multiple languages (English, Chinese, Japanese, Korean) and includes a customer service chatbot.

## Features

- **Responsive Design**: Fully responsive layout optimized for desktop and mobile devices.
- **Dynamic Content**: All major content sections (Services, Gallery, Social Updates, Banners) are fetched from Firebase Realtime Database.
- **Internationalization (i18n)**:
  - Supports English (EN), Chinese (ZH), Japanese (JP), and Korean (KO).
  - Language switcher with persistent user preference.
  - Admin panel supports inputting content in all 4 languages.
- **Admin Dashboard**:
  - Secure login via Firebase Auth.
  - Manage SEO settings.
  - Add/Remove Home Page Banners.
  - Manage Service Packages (descriptions, prices, images).
  - Manage Gallery Photos and Videos (YouTube support).
  - Manage Social Media posts.
  - Manage Membership Card details.
  - Train the AI Chatbot via a custom system prompt.
- **AI Chatbot**:
  - Integrated chat widget.
  - Powered by Groq API (Llama 3 model) via Netlify Functions.
  - Context-aware responses based on admin-defined training data.
- **Media Gallery**: Lightbox support for photos and embedded video players.
