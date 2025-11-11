import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import '../styles/wordpress-preview.css';

/**
 * PreviewPage Component
 *
 * Renders a WordPress-style preview of the HTML content from a task.
 * Mimics the extpros.com site structure with header, content area, sidebar, and footer.
 */
export default function PreviewPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks } = useTaskContext();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Override body styles for clean white background
    document.body.style.backgroundColor = '#fff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.fontFamily = '';
    };
  }, []);

  useEffect(() => {
    if (!taskId) {
      navigate('/');
      return;
    }

    // Find the task by ID
    const foundTask = tasks.find(t => t.id === taskId);

    if (foundTask) {
      setTask(foundTask);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [taskId, tasks, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-text)',
        fontSize: '1.2rem',
        color: 'var(--text)'
      }}>
        Loading preview...
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-text)',
        fontSize: '1.2rem',
        color: 'var(--text)'
      }}>
        Task not found
      </div>
    );
  }

  // Process HTML content to replace shortcodes
  const processHtmlContent = (html: string) => {
    if (!html) return '<p>No content available</p>';
    
    // Replace [cta-btn] with actual button HTML
    return html.replace(
      /\[cta-btn\]/gi,
      '<a href="#sidebar" class="cta-button" onclick="document.getElementById(\'sidebar\').scrollIntoView({behavior: \'smooth\'})">Free Estimate</a>'
    );
  };

  return (
    <div className="wordpress-preview">
      {/* Top Bar */}
      <div className="site-header-top-row">
        <div className="site-container">
          <ul className="contact-info">
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              W227N6270 Sussex Rd, Sussex, WI 53089
            </li>
          </ul>
          <ul className="menu phone-number">
            <li>
              <a href="tel:262-747-0495">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                (262) 747-0495
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Header */}
      <header className="site-header-menu-row">
        <div className="site-container site-header-container">
          <div className="logo">
            {/* Dummy Logo */}
            <div className="logo-box">
              <div className="logo-icon">EP</div>
              <div className="logo-text">
                <div className="logo-primary">EXTERIOR PROS</div>
                <div className="logo-secondary">& BATHS</div>
              </div>
            </div>
          </div>
          <nav className="main-nav">
            <a href="#">Roofing</a>
            <a href="#">Windows</a>
            <a href="#">Baths</a>
            <a href="#">Other Services</a>
            <a href="#">Why Us</a>
            <a href="#">About</a>
            <a href="#" className="contact-btn">Contact Us</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="content">
        <div className="site-container">
          <div className="site-grid site-grid--2x1">
            {/* Content Area - Where user's HTML is rendered */}
            <article className="entry-content">
              {/* Featured Image */}
              {task.featuredImg && (
                <>
                  <img
                    src={task.featuredImg}
                    alt={task.featuredAlt || 'Featured image'}
                    className="featured-image"
                  />
                  <hr />
                </>
              )}

              {/* User's HTML Content */}
              <div
                className="wp-content"
                dangerouslySetInnerHTML={{ __html: processHtmlContent(task.htmlContent) }}
              />
            </article>

            {/* Sidebar */}
            <aside id="sidebar">
              <div className="widget widget-estimate">
                <div className="widget-header">
                  <h3>Free Estimate</h3>
                </div>
                <div className="widget-body">
                  <form className="estimate-form">
                    <div className="form-row">
                      <input type="text" placeholder="First Name *" className="form-input" />
                      <input type="text" placeholder="Last Name *" className="form-input" />
                    </div>
                    <input type="tel" placeholder="Phone Number *" className="form-input" />
                    <input type="email" placeholder="Email Address" className="form-input" />
                    <input type="text" placeholder="Zip Code *" className="form-input" />
                    <textarea placeholder="How can we help you?" rows={4} className="form-textarea"></textarea>
                    <button type="submit" className="form-submit">Submit</button>
                  </form>
                  <p className="form-disclaimer">
                    By submitting this form, you agree to receive automated texts or calls from Exterior Pros.
                    Msg & data rates may apply. Reply STOP to cancel. You also agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    Consent is not a condition of purchase.
                  </p>
                </div>
              </div>

              <div className="widget widget-reviews">
                <h3>Recent Reviews</h3>
                <div className="review-item">
                  <div className="review-content">
                    <div className="review-avatar">C</div>
                    <div className="review-details">
                      <div className="review-header">
                        <p className="review-name">Craig S</p>
                        <img src="https://www.extpros.com/wp-content/uploads/2024/04/Google-Review-Icon.png" alt="Google" className="review-source" />
                      </div>
                      <div className="review-stars">★★★★★</div>
                      <p className="review-text">
                        Exterior Pros installed the Turtle Shell gutter protection on the back side of
                        my house, where I had challenges with debris from a big tree...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="site-container">
          <div className="site-grid footer-grid">
            <div className="footer-column">
              <h5>Our Services</h5>
              <ul>
                <li><a href="#">Roofing</a></li>
                <li><a href="#">Siding</a></li>
                <li><a href="#">Windows</a></li>
                <li><a href="#">Baths</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>Why Us</h5>
              <ul>
                <li><a href="#">Our Team</a></li>
                <li><a href="#">Reviews</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>Contact</h5>
              <p>
                <a href="tel:262-123-4567">(262) 123-4567</a>
              </p>
            </div>
          </div>
          <hr />
          <p className="footer-copyright">
            © 2025 Exterior Pros & Baths. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
