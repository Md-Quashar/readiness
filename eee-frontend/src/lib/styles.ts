export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    overflow-x: hidden;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .eee-nav-link {
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .eee-feature-card {
    border-radius: 16px;
    padding: 28px 24px;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    cursor: default;
  }

  .eee-feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }

  .eee-step-card {
    border-radius: 14px;
    padding: 28px 20px;
    text-align: center;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    flex: 1;
    min-width: 160px;
  }

  .eee-step-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }

  .eee-req-card {
    border-radius: 14px;
    padding: 22px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .eee-req-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }

  .eee-btn-primary {
    border: none;
    padding: 14px 36px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .eee-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(29, 78, 216, 0.35);
  }

  .eee-btn-outline {
    background: transparent;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .eee-toggle-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .eee-section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .eee-fade-in {
    animation: eeeSlideUp 0.6s ease both;
  }

  .eee-fade-in-delay-1 { animation-delay: 0.1s; }
  .eee-fade-in-delay-2 { animation-delay: 0.2s; }
  .eee-fade-in-delay-3 { animation-delay: 0.3s; }

  @keyframes eeeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .eee-display-font {
    font-family: 'DM Serif Display', Georgia, serif;
  }

  @media (max-width: 768px) {
    .eee-steps-row {
      flex-direction: column !important;
    }
    .eee-steps-arrow {
      transform: rotate(90deg);
    }
    .eee-features-grid {
      grid-template-columns: 1fr !important;
    }
    .eee-req-grid {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .eee-req-grid > * {
      max-width: 100% !important;
      flex-basis: 100% !important;
    }
    .eee-hero-btns {
      flex-direction: column;
      align-items: center;
    }
    .eee-nav-links {
      gap: 2px !important;
    }
    .eee-nav-link span {
      display: none;
    }
    .eee-feature-card {
      padding: 20px 18px;
    }
    .eee-step-card {
      padding: 20px 16px;
      min-width: auto;
    }
    .eee-btn-primary {
      padding: 12px 28px;
      font-size: 14px;
    }
    .eee-btn-outline {
      padding: 12px 22px;
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .eee-feature-card {
      padding: 16px 14px;
    }
    .eee-req-card {
      padding: 16px;
      gap: 12px;
    }
    .eee-step-card {
      padding: 16px 12px;
    }
    .eee-btn-primary {
      padding: 10px 22px;
      font-size: 13px;
      width: 100%;
      justify-content: center;
    }
    .eee-btn-outline {
      padding: 10px 18px;
      font-size: 13px;
      width: 100%;
      justify-content: center;
    }
    .eee-section-badge {
      font-size: 10px;
      padding: 3px 10px;
    }
  }
`;
