import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import LandingPageHeader from '../components/LandingPageHeader';
import WhatsAppButton from '../components/WhatsAppButton';
import '../styles/HomePage.css';
import '../styles/Animations.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <LandingPageHeader />
      <WhatsAppButton phoneNumber="972549774827" />

      <div className="landing-page-v6">
        {/* --- HERO SECTION --- */}
        <header className="hero-section-v6">
          <div className="hero-overlay"></div>
          <div className="hero-content animate-on-load">
            <h1 className="hero-title">
              הגיע הזמן לנהל את הסטודיו,<br />
              במקום שהסטודיו ינהל אותך.
            </h1>
            <p className="hero-subtitle">
              FiTime היא המערכת שעושה סדר ביומן, חוסכת לך שעות של התעסקות בוואטסאפ, ומנהלת את רשימות ההמתנה והכרטיסיות באופן אוטומטי.
            </p>
            
            {/* באנר מבצע השקה */}
            <div className="launch-offer-badge" style={{ 
                background: 'rgba(255,255,255,0.15)', 
                backdropFilter: 'blur(10px)',
                padding: '12px 25px', 
                borderRadius: '50px', 
                marginBottom: '25px',
                border: '1px solid #ffd700',
                display: 'inline-block',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
                <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.2rem' }}>🚀 מבצע השקה:</span>
                <span style={{ color: '#fff', marginLeft: '10px', fontSize: '1.1rem' }}>נרשמים היום ומקבלים חודשיים ראשונים במתנה!</span>
            </div>

            <TypeAnimation
              sequence={[
                'סוף להודעות וואטסאפ בלילה', 2000,
                'רשימות המתנה שעובדות לבד', 2000,
                'מעקב מדויק אחרי כרטיסיות', 2000,
                'מערכת שעות דיגיטלית', 3000,
              ]}
              wrapper="div"
              cursor={true}
              repeat={Infinity}
              className="animated-text"
            />
            
            <div style={{ marginTop: '30px' }}>
              <button className="btn btn-primary hero-cta-button" onClick={() => navigate('/register')}>
                התחילו עכשיו - חינם לחודשיים
              </button>
              <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>ללא פרטי אשראי | ללא התחייבות</p>
            </div>
          </div>
        </header>

        {/* --- PROBLEM / SOLUTION SECTION --- */}
        <section className="features-grid-section fade-in" style={{ padding: '4rem 2rem', background: '#f8f9fa' }}>
          <div className="container">
            <h2 className="section-title" style={{ color: '#333', textAlign: 'center', marginBottom: '3rem' }}>למה בעלי סטודיו עוברים ל-FiTime?</h2>
            
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Feature 1 - אמת: זה עובד בקוד שלך */}
              <div className="feature-card" style={{ background: '#fff', padding: '2rem', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ marginBottom: '1rem' }}>רשימת המתנה אוטומטית</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  מתאמן ביטל ברגע האחרון? המערכת תזהה את זה, תשלח SMS לממתינים, ותשבץ את הראשון שיאשר. 
                  <strong>התוצאה: 0 חורים בלו"ז במינימום מאמץ.</strong>
                </p>
              </div>

              {/* Feature 2 - אמת: האתר רספונסיבי ועובד בטלפון */}
              <div className="feature-card" style={{ background: '#fff', padding: '2rem', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                <h3 style={{ marginBottom: '1rem' }}>רישום עצמאי מהנייד</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  שחררו את הטלפון שלכם. המתאמנים נרשמים, מבטלים ורואים כמה ניקובים נשארו להם ישירות מהטלפון שלהם.
                  אתם מקבלים שקט נפשי.
                </p>
              </div>

              {/* Feature 3 - אמת: יש דאשבורד ניהול וניהול יומן */}
              <div className="feature-card" style={{ background: '#fff', padding: '2rem', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ marginBottom: '1rem' }}>שליטה וסדר ביומן</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  לוח שנה צבעוני וברור שמראה לכם בדיוק מה קורה בסטודיו: איזה שיעורים מלאים, מי המאמן, וכמה נרשמו לכל שיעור.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* --- DEEP DIVE SECTION --- */}
        <section id="features" className="persona-section owner-section fade-in">
          <div className="persona-content container">
            <div className="persona-text">
              <span className="section-tag">החלק האהוב על המנהלים</span>
              <h2 className="persona-title">ניהול מנויים וכרטיסיות</h2>
              <p>
                החלק הכי מתסכל בניהול סטודיו הוא המעקב אחרי ניקובים ("כמה נשאר לי?").
                ב-FiTime, המערכת סופרת את הניקובים אוטומטית בכל הרשמה, וחוסמת רישום כשנגמרת הכרטיסייה.
              </p>
              <ul style={{ marginTop: '1.5rem', listStyle: 'none', padding: 0 }}>
                {/* אמת: המערכת בודקת memberships וחוסמת אם אין ניקובים */}
                <li style={{ marginBottom: '10px' }}>✅ חסימת הרשמה כשנגמר המנוי</li>
                <li style={{ marginBottom: '10px' }}>✅ שקיפות מלאה למתאמן על יתרת הניקובים</li>
                <li style={{ marginBottom: '10px' }}>✅ היסטוריית שיעורים לכל מתאמן</li>
              </ul>
            </div>
            <div className="persona-image-container">
              <img src="/images/owner-dashboard.png" alt="ניהול יומן ומנויים" style={{ borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="pricing-section fade-in">
            <div className="container">
              <h2 className="section-title">הצטרפו עכשיו ללא סיכון</h2>
              <div className="pricing-card-wrapper">
                <div className="pricing-card" style={{ border: '2px solid #4caf50', transform: 'scale(1.05)' }}>
                  
                  <div style={{ 
                      background: '#4caf50', color: 'white', padding: '5px 10px', 
                      borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold',
                      position: 'absolute', top: '-15px', right: '50%', transform: 'translateX(50%)' 
                  }}>
                      הכי משתלם
                  </div>

                  <h3 className="pricing-title">FiTime Founder</h3>
                  
                  <div className="price">₪0<span className="price-term">/ חודשיים ראשונים</span></div>
                  <p className="pricing-subtitle" style={{textDecoration: 'line-through', opacity: 0.6}}>במקום ₪299 לחודש</p>
                  <p className="pricing-subtitle" style={{color: '#2e7d32', fontWeight: 'bold', marginBottom: '20px'}}>
                      מתנה למצטרפים בתקופת ההשקה!
                  </p>

                  <ul className="pricing-features">
                    <li>✅ <strong>ללא הגבלת</strong> מתאמנים</li>
                    <li>✅ <strong>ללא הגבלת</strong> כמות שיעורים</li>
                    <li>✅ ניהול יומן, מנויים וכרטיסיות</li>
                    <li>✅ רשימות המתנה אוטומטיות (SMS)</li>
                    <li>✅ גישה מלאה מכל טלפון ומחשב</li>
                    <li>✅ תמיכה אישית בווטסאפ</li>
                  </ul>
                  
                  <button className="btn btn-primary" style={{width: '100%', fontSize: '1.1rem', padding: '15px'}} onClick={() => navigate('/register')}>
                    אני רוצה להצטרף בחינם 👈
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                      ההרשמה לוקחת דקה. אין צורך בפרטי אשראי.
                  </p>
                </div>
              </div>
            </div>
        </section>

        <footer className="lp-footer">
          <div className="footer-bottom">
            © {new Date().getFullYear()} FiTime. מערכת לניהול סטודיו פילאטיס וכושר.
          </div>
        </footer>
      </div>
    </>
  );
}

export default HomePage;