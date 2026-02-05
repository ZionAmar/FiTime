import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import LandingPageHeader from '../components/LandingPageHeader';
import WhatsAppButton from '../components/WhatsAppButton';
import '../styles/HomePage.css';
import '../styles/Animations.css';

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. ניסיון לשלוף נתוני משתמש מהזיכרון המקומי של הדפדפן
    const user = localStorage.getItem('activeRole');

    // 2. אם נמצא משתמש (כלומר, הוא התחבר בעבר ולא עשה Logout)
    if (user) {
      // 3. בצע ניתוב מחדש (Redirect) ישירות לדשבורד
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  return (
    <>
      <LandingPageHeader />
      <WhatsAppButton phoneNumber="972549774827" />

      <div className="landing-page-v6">

        {/* --- HERO SECTION --- */}
        <header className="hero-section-v6">
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <div className="launch-badge">
              <span>🚀</span>
              <span className="launch-badge-text">
                מבצע השקה: חודשיים ראשונים עלינו!
              </span>
            </div>

            <h1 className="hero-title">
              הגיע הזמן לנהל את הסטודיו,<br />
              במקום שהסטודיו ינהל אותך.
            </h1>

            <p className="hero-subtitle">
              FiTime עושה סדר ביומן, חוסכת שעות של התעסקות בוואטסאפ, ומנהלת את רשימות ההמתנה והכרטיסיות באופן אוטומטי לחלוטין.
            </p>

            <div className="animated-text-wrapper">
              <TypeAnimation
                sequence={[
                  'סוף להודעות וואטסאפ בלילה', 2000,
                  'רשימות המתנה שעובדות לבד', 2000,
                  'מעקב מדויק אחרי כרטיסיות', 2000,
                  'מערכת שעות דיגיטלית ומעוצבת', 3000,
                ]}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                className="animated-text"
              />
            </div>

            <div>
              <button className="hero-cta-button" onClick={() => navigate('/register')}>
                התחילו עכשיו בחינם 👈
              </button>
              <p style={{ marginTop: '12px', fontSize: '0.85rem', opacity: 0.8 }}>
                ללא פרטי אשראי • ללא התחייבות
              </p>
            </div>
          </div>
        </header>

        {/* --- FEATURES GRID --- */}
        <section className="features-section">
          <div className="container-custom">
            <h2 className="section-title">למה מנהלי סטודיו עוברים ל-FiTime?</h2>

            <div className="features-grid">

              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>רשימת המתנה אוטומטית</h3>
                <p>
                  מתאמן ביטל? המערכת תזהה את זה, תשלח SMS לממתינים, ותשבץ את הראשון שיאשר.
                  <strong> אפס חורים בלו"ז במינימום מאמץ.</strong>
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>רישום עצמאי באפליקציה</h3>
                <p>
                  שחררו את הטלפון. המתאמנים נרשמים, מבטלים ורואים כמה ניקובים נשארו להם ישירות מהטלפון.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>שליטה וסדר ביומן</h3>
                <p>
                  דאשבורד צבעוני וברור שמראה לכם בדיוק מה קורה בסטודיו בזמן אמת: נוכחות, כספים וביצועים.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* --- DEEP DIVE SECTION --- */}
        <section id="features" className="owner-section">
          <div className="container-custom">
            <div className="owner-content-wrapper">

              <div className="owner-text">
                <span className="tag-label">החלק האהוב על המנהלים</span>
                <h2 className="owner-title">ניהול מנויים וכרטיסיות ללא כאב ראש</h2>
                <p style={{ fontSize: '1.1rem', color: '#475569' }}>
                  החלק הכי מתסכל בניהול סטודיו הוא המעקב אחרי ניקובים ("כמה נשאר לי?").
                  ב-FiTime, המערכת סופרת את הניקובים אוטומטית וחוסמת רישום כשנגמרת הכרטיסייה.
                </p>
                <ul className="check-list">
                  <li><span className="check-mark">✓</span> חסימת הרשמה כשנגמר המנוי</li>
                  <li><span className="check-mark">✓</span> שקיפות מלאה למתאמן על יתרת הניקובים</li>
                  <li><span className="check-mark">✓</span> הפקת דוחות נוכחות בלחיצה</li>
                </ul>
              </div>

              <div className="owner-image-wrapper">
                <img src="/images/owner-dashboard.png" alt="ניהול יומן ומנויים" />
              </div>

            </div>
          </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="pricing-section">
          <div className="container-custom">
            <h2 className="section-title">מסלול ה-Founder שלנו</h2>

            <div className="pricing-card-container">
              <div className="pricing-card">

                <div className="best-value-badge">
                  הכי משתלם
                </div>

                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>FiTime Premium</h3>

                <div className="price-large">₪0</div>
                <div className="price-period">לחודשיים הראשונים</div>
                <div className="old-price">במקום ₪299 לחודש</div>

                <div className="gift-text">
                  🎁 הטבה ייחודית לתקופת ההשקה!
                </div>

                <ul className="check-list pricing-features">
                  <li><span className="check-mark">✓</span> ללא הגבלת מתאמנים</li>
                  <li><span className="check-mark">✓</span> ללא הגבלת כמות שיעורים</li>
                  <li><span className="check-mark">✓</span> ניהול יומן, מנויים וכרטיסיות</li>
                  <li><span className="check-mark">✓</span> רשימות המתנה אוטומטיות (SMS)</li>
                  <li><span className="check-mark">✓</span> תמיכה אישית בוואטסאפ</li>
                </ul>

                <button className="btn-block" onClick={() => navigate('/register')}>
                  אני רוצה להצטרף בחינם
                </button>
                <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  ההרשמה לוקחת דקה. אין צורך בפרטי אשראי.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="container-custom">
            © {new Date().getFullYear()} FiTime. כל הזכויות שמורות.
          </div>
        </footer>
      </div>
    </>
  );
}

export default HomePage;