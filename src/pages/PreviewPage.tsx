import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import { Company, TaskImage } from '../types';
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
  const { tasks, getCompanyById, companies } = useTaskContext();
  const [task, setTask] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
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

    // Wait for companies to load
    if (companies.length === 0) {
      return;
    }

    // Find the task by ID
    const foundTask = tasks.find(t => t.id === taskId);

    if (foundTask) {
      setTask(foundTask);
      
      // Get the company for this task
      if (foundTask.companyId) {
        const foundCompany = getCompanyById(foundTask.companyId);
        console.log('Found company:', foundCompany);
        console.log('Company logoUrl:', foundCompany?.logoUrl);
        console.log('Company name:', foundCompany?.name);
        setCompany(foundCompany || null);
      } else {
        console.log('Task has no companyId');
        setCompany(null);
      }
      
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [taskId, tasks, companies, navigate, getCompanyById]);

  // Handle FAQ accordion interactions
  useEffect(() => {
    const handleFaqClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const header = target.closest('.faq-header');
      if (!header) return;

      const faqItem = header.parentElement;
      if (!faqItem || !faqItem.classList.contains('faq-item')) return;

      const content = faqItem.querySelector('.faq-content') as HTMLElement;
      const icon = faqItem.querySelector('.faq-icon') as HTMLElement;
      if (!content || !icon) return;

      const isOpen = faqItem.classList.contains('open');

      if (isOpen) {
        // Close this item
        faqItem.classList.remove('open');
        content.style.display = 'none';
        icon.textContent = '+';
      } else {
        // Close all other items
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach((item) => {
          if (item !== faqItem) {
            item.classList.remove('open');
            const otherContent = item.querySelector('.faq-content') as HTMLElement;
            const otherIcon = item.querySelector('.faq-icon') as HTMLElement;
            if (otherContent) otherContent.style.display = 'none';
            if (otherIcon) otherIcon.textContent = '+';
          }
        });

        // Open this item
        faqItem.classList.add('open');
        content.style.display = 'block';
        icon.textContent = '×';
      }
    };

    document.addEventListener('click', handleFaqClick);
    return () => {
      document.removeEventListener('click', handleFaqClick);
    };
  }, [task]);

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

  // Validate HTML content
  const validateHTML = (html: string): { isValid: boolean; errors: Array<{ message: string; position?: number }> } => {
    if (!html || html.trim().length === 0) {
      return { isValid: false, errors: [{ message: 'HTML content is empty' }] };
    }

    const errors: Array<{ message: string; position?: number }> = [];
    
    // Check for unclosed tags
    const tagStack: Array<{ tag: string; position: number }> = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const isClosing = fullTag.startsWith('</');
      const position = match.index;
      
      // Skip self-closing tags
      if (selfClosingTags.includes(tagName)) {
        continue;
      }
      
      // Check if it's a self-closing tag with />
      if (fullTag.endsWith('/>')) {
        continue;
      }
      
      if (isClosing) {
        // Find matching opening tag
        if (tagStack.length === 0) {
          errors.push({ 
            message: `Closing tag </${tagName}> found without matching opening tag`,
            position: position
          });
        } else {
          const lastTag = tagStack.pop()!;
          if (lastTag.tag !== tagName) {
            errors.push({ 
              message: `Mismatched tags: expected </${lastTag.tag}>, found </${tagName}>`,
              position: position
            });
            // Try to find the correct tag in the stack
            const correctIndex = tagStack.findIndex(item => item.tag === tagName);
            if (correctIndex !== -1) {
              tagStack.splice(correctIndex);
            }
          }
        }
      } else {
        // Opening tag
        tagStack.push({ tag: tagName, position: position });
      }
    }
    
    // Check for unclosed tags
    if (tagStack.length > 0) {
      tagStack.forEach(({ tag, position }) => {
        errors.push({ 
          message: `Unclosed tag: <${tag}>`,
          position: position
        });
      });
    }
    
    // Check for unclosed quotes in HTML tag attributes only (not in shortcodes)
    // Also check for tags missing closing >
    // Find all < characters and process potential tags
    for (let i = 0; i < html.length; i++) {
      if (html[i] === '<') {
        // Skip if this is part of a shortcode (starts with [)
        // Check backwards a bit to see if we're in a shortcode context
        let isShortcode = false;
        for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
          if (html[j] === '[') {
            isShortcode = true;
            break;
          } else if (html[j] === ']') {
            break; // Not in a shortcode
          }
        }
        if (isShortcode) continue;
        
        // Find where this tag should end
        let tagEnd = i + 1;
        let inQuotes = false;
        let quoteChar = '';
        let quoteStartPos = 0;
        let foundClosingBracket = false;
        
        // Process the tag to find its end and check for unclosed quotes
        while (tagEnd < html.length) {
          const char = html[tagEnd];
          
          // If we hit a newline without closing, the tag is malformed
          if (char === '\n' && !inQuotes) {
            break;
          }
          
          // If we hit another < without closing, this tag is malformed
          if (char === '<' && !inQuotes) {
            break;
          }
          
          // Track quotes
          if (!inQuotes && (char === '"' || char === "'")) {
            // Check if this quote is part of an attribute (has = before it)
            let foundEquals = false;
            for (let j = tagEnd - 1; j >= i; j--) {
              if (html[j] === '=') {
                foundEquals = true;
                break;
              } else if (html[j].trim() === '') {
                continue; // Skip whitespace
              } else if (html[j] === '<' || html[j] === '>') {
                break; // Hit tag boundary
              } else {
                break; // Not an attribute quote
              }
            }
            
            if (foundEquals) {
              inQuotes = true;
              quoteChar = char;
              quoteStartPos = tagEnd;
            }
          } else if (inQuotes && char === quoteChar) {
            // Found closing quote
            inQuotes = false;
          }
          
          // Check for closing bracket
          if (char === '>' && !inQuotes) {
            foundClosingBracket = true;
            tagEnd++;
            break;
          }
          
          tagEnd++;
        }
        
        // Extract tag content for analysis
        const tagContent = html.substring(i, tagEnd);
        
        // Skip comments and CDATA
        if (tagContent.startsWith('<!--') || tagContent.startsWith('<![CDATA[')) {
          i = tagEnd - 1;
          continue;
        }
        
        // If we're still in quotes, it's unclosed
        if (inQuotes) {
          errors.push({ 
            message: 'Unclosed quote in HTML attributes',
            position: quoteStartPos
          });
        }
        
        // Check if tag is missing closing bracket
        if (!foundClosingBracket && tagContent.length > 1) {
          const trimmed = tagContent.trim();
          // Don't flag if it's a comment or if it looks like it might be intentional
          if (!trimmed.startsWith('<!--') && !trimmed.startsWith('<!')) {
            errors.push({ 
              message: `HTML tag missing closing bracket '>'`,
              position: i
            });
          }
        }
        
        // Skip to the end of this tag for next iteration
        i = tagEnd - 1;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors // Don't add a success message to errors array
    };
  };

  // Extract filename from production URL with multiple strategies
  // Pattern: basePath/YYYY/MM/prefix-filename.suffix
  const extractFilenameFromUrl = (url: string, company: Company | null): string | null => {
    if (!company || !url) return null;
    
    try {
      let remaining = url;
      
      // Strategy 1: Remove base path
      if (company.basePath) {
        // Try exact match first
        if (remaining.startsWith(company.basePath)) {
          remaining = remaining.substring(company.basePath.length);
        } else {
          // Try without trailing slash
          const basePathNoSlash = company.basePath.replace(/\/$/, '');
          if (remaining.startsWith(basePathNoSlash)) {
            remaining = remaining.substring(basePathNoSlash.length);
          }
        }
      }
      
      // Strategy 2: Remove year/month pattern (e.g., "2024/12/" or "2024/12")
      remaining = remaining.replace(/^\/?\d{4}\/?\d{2}\/?/, '');
      
      // Strategy 3: Remove prefix if present
      if (company.prefix) {
        if (remaining.startsWith(company.prefix)) {
          remaining = remaining.substring(company.prefix.length);
        } else if (remaining.includes(company.prefix)) {
          // Prefix might be in the middle, extract everything after it
          const prefixIndex = remaining.indexOf(company.prefix);
          remaining = remaining.substring(prefixIndex + company.prefix.length);
        }
      }
      
      // Strategy 4: Remove suffix if present
      if (company.fileSuffix) {
        if (remaining.endsWith(company.fileSuffix)) {
          remaining = remaining.substring(0, remaining.length - company.fileSuffix.length);
        }
      }
      
      // Strategy 5: Remove file extension and clean up
      remaining = remaining.replace(/^\//, ''); // Remove leading slash
      remaining = remaining.replace(/\/$/, ''); // Remove trailing slash
      const filenameWithoutExt = remaining.replace(/\.[^/.]+$/, '');
      
      // Clean up any remaining path segments
      const lastSegment = filenameWithoutExt.split('/').pop() || filenameWithoutExt;
      
      return lastSegment.toLowerCase().trim();
    } catch (e) {
      console.error('Error extracting filename:', e);
      return null;
    }
  };

  // Process HTML content to replace shortcodes and image URLs
  const processHtmlContent = (html: string) => {
    if (!html) return '<p>No content available</p>';
    
    let processed = html;
    
    // Replace image src URLs with uploaded images (for preview only)
    if (task.images && task.images.length > 0 && company) {
      const usedImageIndices = new Set<number>(); // Track which images have been used
      let fallbackIndex = 0; // Track index for fallback matching
      
      // Find all img tags and replace src if we can match to uploaded image
      // Handle both src="url" and src='url' and empty src=""
      processed = processed.replace(
        /<img([^>]*?)(?:\s+src=(["'])([^"']*?)\2)([^>]*)>/gi,
        (match, beforeSrc, quote, srcUrl, afterSrc) => {
          // Handle empty src
          if (!srcUrl || srcUrl.trim() === '') {
            // Find next unused image
            while (fallbackIndex < task.images.length && usedImageIndices.has(fallbackIndex)) {
              fallbackIndex++;
            }
            if (fallbackIndex < task.images.length) {
              const imageUrl = task.images[fallbackIndex].url;
              usedImageIndices.add(fallbackIndex);
              fallbackIndex++;
              return `<img${beforeSrc} src=${quote}${imageUrl}${quote}${afterSrc}>`;
            }
            return match;
          }
          
          // Strategy 1: Extract filename from production URL and match exactly
          const extractedFilename = extractFilenameFromUrl(srcUrl, company);
          let matchingImage: { image: TaskImage; index: number } | null = null;
          
          if (extractedFilename) {
            // Try exact match first (only unused images)
            const exactMatch = task.images.findIndex((img, idx) => {
              if (usedImageIndices.has(idx)) return false;
              const imgFilename = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
              return imgFilename === extractedFilename;
            });
            
            if (exactMatch !== -1) {
              matchingImage = { image: task.images[exactMatch], index: exactMatch };
            } else {
              // Strategy 2: Try partial match (filename contains extracted or vice versa)
              const partialMatch = task.images.findIndex((img, idx) => {
                if (usedImageIndices.has(idx)) return false;
                const imgFilename = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
                return imgFilename.includes(extractedFilename) || extractedFilename.includes(imgFilename);
              });
              
              if (partialMatch !== -1) {
                matchingImage = { image: task.images[partialMatch], index: partialMatch };
              } else {
                // Strategy 3: Try matching by filename in URL (extract last segment)
                const urlFilename = srcUrl.split('/').pop()?.replace(/\.[^/.]+$/, '').toLowerCase() || '';
                const urlMatch = task.images.findIndex((img, idx) => {
                  if (usedImageIndices.has(idx)) return false;
                  const imgFilename = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
                  return imgFilename === urlFilename || urlFilename.includes(imgFilename) || imgFilename.includes(urlFilename);
                });
                
                if (urlMatch !== -1) {
                  matchingImage = { image: task.images[urlMatch], index: urlMatch };
                }
              }
            }
          }
          
          // Strategy 4: Fallback to index-based matching (first img = first uploaded, etc.)
          if (!matchingImage) {
            while (fallbackIndex < task.images.length && usedImageIndices.has(fallbackIndex)) {
              fallbackIndex++;
            }
            if (fallbackIndex < task.images.length) {
              matchingImage = { image: task.images[fallbackIndex], index: fallbackIndex };
              fallbackIndex++;
            }
          }
          
          if (matchingImage) {
            usedImageIndices.add(matchingImage.index);
            return `<img${beforeSrc} src=${quote}${matchingImage.image.url}${quote}${afterSrc}>`;
          }
          
          // No match found, return original
          return match;
        }
      );
      
      // Also handle img tags without src attribute (use next unused images)
      processed = processed.replace(
        /<img((?![^>]*\s+src=)[^>]*)>/gi,
        (match, attributes) => {
          while (fallbackIndex < task.images.length && usedImageIndices.has(fallbackIndex)) {
            fallbackIndex++;
          }
          if (fallbackIndex < task.images.length) {
            const imageUrl = task.images[fallbackIndex].url;
            usedImageIndices.add(fallbackIndex);
            fallbackIndex++;
            return `<img${attributes} src="${imageUrl}">`;
          }
          return match;
        }
      );
    }
    
    // Replace [cta-btn] with actual button HTML
    processed = processed.replace(
      /\[cta-btn\]/gi,
      '<a href="#sidebar" class="cta-button" onclick="document.getElementById(\'sidebar\').scrollIntoView({behavior: \'smooth\'})">Free Estimate</a>'
    );
    
    // Replace [reviews amount="X" category=""] with fake reviews
    processed = processed.replace(
      /\[reviews\s+amount=["']?(\d+)["']?\s+category=["']?([^"']*)["']?\]/gi,
      (match, amount, category) => {
        const reviewCount = parseInt(amount) || 3;
        return generateFakeReviews(reviewCount);
      }
    );
    
    // Also handle [reviews] without attributes (default to 3)
    processed = processed.replace(
      /\[reviews\]/gi,
      generateFakeReviews(3)
    );
    
    // Replace [faqs category=""] with fake FAQ accordion
    processed = processed.replace(
      /\[faqs\s+category=["']?([^"']*)["']?\]/gi,
      (match, category) => {
        return generateFakeFAQs();
      }
    );
    
    // Also handle [faqs] without attributes
    processed = processed.replace(
      /\[faqs\]/gi,
      generateFakeFAQs()
    );
    
    return processed;
  };

  // Generate fake FAQs HTML
  const generateFakeFAQs = (): string => {
    const faqs = [
      {
        question: 'How Do I Know Which Exterior Door Is Right For My Sussex, WI Home?',
        answer: 'Our experts help you select the perfect door based on style, function, and budget. Learn more about <a href="#">your options</a>.',
        isOpen: true
      },
      {
        question: 'How Do Quality Patio Doors Improve My Living Space?',
        answer: 'Quality patio doors enhance your living space by providing seamless indoor-outdoor flow, natural light, and improved energy efficiency. They create a more open, inviting atmosphere while maintaining security and weather protection.',
        isOpen: false
      },
      {
        question: 'What Are The Benefits Of Installing A New Front Entry Door?',
        answer: 'A new front entry door improves curb appeal, increases home security, enhances energy efficiency, and can significantly boost your property value. Modern doors also offer better insulation and weather resistance.',
        isOpen: false
      },
      {
        question: 'Where Can I Find More Info About Exterior Pros & Baths?',
        answer: 'You can find more information about our services, reviews, and company history on our website. Visit our <a href="#">About Us</a> page or contact us directly for personalized assistance.',
        isOpen: false
      },
      {
        question: 'Why Do Homeowners Trust Exterior Pros & Baths For Door Installations In Sussex, WI?',
        answer: 'Homeowners trust us because of our years of experience, commitment to quality craftsmanship, excellent customer service, and comprehensive warranties. We use only premium materials and stand behind our work.',
        isOpen: false
      }
    ];

    return `
      <div class="faq-accordion">
        ${faqs.map((faq, index) => `
          <div class="faq-item ${faq.isOpen ? 'open' : ''}">
            <div class="faq-header" data-faq-index="${index}">
              <h3 class="faq-question">${faq.question}</h3>
              <span class="faq-icon">${faq.isOpen ? '×' : '+'}</span>
            </div>
            <div class="faq-content" style="display: ${faq.isOpen ? 'block' : 'none'}"><p>${faq.answer}</p></div>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Generate fake reviews HTML
  const generateFakeReviews = (count: number): string => {
    const reviews = [
      {
        reviewer: 'Craig S.',
        date: 'April 7, 2025',
        title: 'Satisfied Customer Here',
        text: 'Exterior Pros installed the Turtle Shell gutter protection on the back side of my house, where I had challenges with debris from a big tree that partially overhangs my roof. It led to my gutters repeatedly filling up and then water spilling over on the drip edge. The installation was professional and the product works exactly as promised.',
      },
      {
        reviewer: 'Vince M.',
        date: 'July 16, 2024',
        title: 'My Concerns Were Addressed',
        text: 'I want to retract any negative information I gave about this business. I spoke with the owner and my concerns were addressed and taken care of. The work they did on my three windows was great and they look great. I would recommend them to anyone looking for quality window replacement.',
      },
      {
        reviewer: 'Maurizio M.',
        date: 'September 24, 2025',
        title: 'Recommended....',
        text: 'From the roof inspection to the installation everything went very smooth and timely. I was very impressed every step of the way. Lisa, Mathew and Matt were very helpful throughout the process. The crew that installed the new roof were also professional and did excellent work.',
      },
    ];

    const reviewsToShow = reviews.slice(0, count);
    
    return `
      <div class="reviews-container">
        ${reviewsToShow.map(review => `
          <div class="review-card">
            <div class="review-header">
              <div class="review-name">${review.reviewer}</div>
              <div class="review-date">${review.date}</div>
            </div>
            <div class="review-stars">★★★★★</div>
            <h4 class="review-title">${review.title}</h4>
            <p class="review-text">${review.text}</p>
            <a href="#" class="review-read-more">Read More ></a>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Extract initials from company name
  const getCompanyInitials = (name: string): string => {
    if (!name) return 'EP';
    
    // Remove common words like "&", "and", "the", etc.
    const cleaned = name.replace(/&|and|the/gi, '').trim();
    
    // Split by spaces and get first letter of each word
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return 'EP';
    
    // Get first letter of first two words, or first two letters of first word
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else {
      return words[0].substring(0, 2).toUpperCase();
    }
  };

  // Split company name into primary and secondary parts
  const getCompanyNameParts = (name: string): { primary: string; secondary: string } => {
    if (!name) return { primary: 'EXTERIOR PROS', secondary: '& BATHS' };
    
    // Check if name contains "&" or "and"
    const hasAnd = name.includes('&') || name.toLowerCase().includes(' and ');
    
    if (hasAnd) {
      // Split by & or "and"
      const parts = name.split(/&| and /i).map(p => p.trim());
      if (parts.length >= 2) {
        return {
          primary: parts[0].toUpperCase(),
          secondary: '& ' + parts[1].toUpperCase()
        };
      }
    }
    
    // If no "&" or "and", use full name as primary
    return {
      primary: name.toUpperCase(),
      secondary: ''
    };
  };

  // Calculate logo display values
  const companyInitials = getCompanyInitials(company?.name || '');
  
  // Get page type from task
  const pageType = task?.type || 'Landing Page';
  const pageTypeDisplay = pageType.toUpperCase();

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
            {/* Company Logo or Dummy Logo */}
            {company?.logoUrl && company.logoUrl.trim() !== '' ? (
              <img 
                src={company.logoUrl} 
                alt={company.name || 'Company logo'} 
                style={{ maxHeight: '100%', height: 'auto', width: 'auto' }}
                onError={(e) => {
                  console.error('Logo failed to load:', company.logoUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="logo-box">
                <div className="logo-icon">{companyInitials}</div>
                <div className="logo-text">
                  <div className="logo-primary">{pageTypeDisplay}</div>
                </div>
              </div>
            )}
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
              <div className="widget widget-checklist">
                <div className="widget-header">
                  <h3>Task Checklist</h3>
                </div>
                <div className="widget-body checklist-body">
                  {/* Task Info Section */}
                  <div className="checklist-section">
                    <h4 className="checklist-section-title">Task Information</h4>
                    <div className="checklist-item">
                      <span className="checklist-label">Page Type:</span>
                      <span className="checklist-value">
                        {task.type || 'Not Set'}
                      </span>
                    </div>
                    <div className="checklist-item">
                      <span className="checklist-label">Company:</span>
                      <span className="checklist-value">{company?.name || 'Not Set'}</span>
                    </div>
                    {task.type !== 'Blog' && (
                      <div className="checklist-item">
                        <span className="checklist-label">City:</span>
                        <span className="checklist-value">
                          {task.mapsLocation ? task.mapsLocation.split(',')[0].trim() : 'Not Set'}
                        </span>
                      </div>
                    )}
                    <div className="checklist-item">
                      <span className="checklist-label">Featured Image:</span>
                      <span className={`checklist-value ${task.featuredImg ? 'checklist-complete' : 'checklist-incomplete'}`}>
                        {task.featuredImg ? '✓ Selected' : '✗ Not Selected'}
                      </span>
                    </div>
                    {task.type !== 'Blog' && (
                      <div className="checklist-item">
                        <span className="checklist-label">Map:</span>
                        <span className={`checklist-value ${(task.mapsEmbedCode || task.mapsLocation) ? 'checklist-complete' : 'checklist-incomplete'}`}>
                          {(task.mapsEmbedCode || task.mapsLocation) ? '✓ Added' : '✗ Not Added'}
                        </span>
                      </div>
                    )}
                    <div className="checklist-item">
                      <span className="checklist-label">Photos:</span>
                      <span className="checklist-value">{task.images?.length || 0} uploaded</span>
                    </div>
                  </div>

                  {/* Text Fields Section */}
                  <div className="checklist-section">
                    <h4 className="checklist-section-title">Text Fields</h4>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.featuredTitle ? 'checked' : 'unchecked'}`}>
                        {task.featuredTitle ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Featured Title</span>
                    </div>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.featuredAlt ? 'checked' : 'unchecked'}`}>
                        {task.featuredAlt ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Featured Alt Text</span>
                    </div>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.widgetTitle ? 'checked' : 'unchecked'}`}>
                        {task.widgetTitle ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Widget Title</span>
                    </div>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.metaTitle ? 'checked' : 'unchecked'}`}>
                        {task.metaTitle ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Meta Title</span>
                    </div>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.metaUrl ? 'checked' : 'unchecked'}`}>
                        {task.metaUrl ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Meta URL</span>
                    </div>
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.metaDescription ? 'checked' : 'unchecked'}`}>
                        {task.metaDescription ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">Meta Description</span>
                    </div>
                    {task.type !== 'Blog' && (
                      <div className="checklist-item">
                        <span className={`checklist-checkbox ${task.instructionsToLink ? 'checked' : 'unchecked'}`}>
                          {task.instructionsToLink ? '✓' : '✗'}
                        </span>
                        <span className="checklist-label">Instructions to Link</span>
                      </div>
                    )}
                    <div className="checklist-item">
                      <span className={`checklist-checkbox ${task.htmlContent && task.htmlContent.trim().length > 0 ? 'checked' : 'unchecked'}`}>
                        {task.htmlContent && task.htmlContent.trim().length > 0 ? '✓' : '✗'}
                      </span>
                      <span className="checklist-label">HTML Content</span>
                    </div>
                  </div>

                  {/* HTML Validation Section */}
                  <div className="checklist-section">
                    <h4 className="checklist-section-title">HTML Validation</h4>
                    {(() => {
                      const validation = validateHTML(task.htmlContent || '');
                      return (
                        <>
                          <div className="checklist-item">
                            <span className={`checklist-checkbox ${validation.isValid ? 'checked' : 'unchecked'}`}>
                              {validation.isValid ? '✓' : '✗'}
                            </span>
                            <span className="checklist-label">HTML Valid</span>
                          </div>
                          {validation.isValid ? (
                            <div className="checklist-validation-success">
                              <div className="checklist-success-item">
                                <span className="checklist-success-icon">✓</span>
                                <span className="checklist-success-text">HTML is valid</span>
                              </div>
                            </div>
                          ) : validation.errors.length > 0 ? (
                            <div className="checklist-validation-errors">
                              {validation.errors.map((error, index) => (
                                <div key={index} className="checklist-error-item">
                                  <span className="checklist-error-icon">⚠</span>
                                  <span className="checklist-error-text">{error.message}</span>
                                  {error.position !== undefined && (
                                    <button
                                      className="checklist-error-button"
                                      onClick={() => {
                                        const url = `/builder/${taskId}?errorPos=${error.position}`;
                                        window.open(url, '_blank');
                                      }}
                                      title="Go to error location in new tab"
                                    >
                                      Go to Error
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>

                  {/* Completion Summary */}
                  <div className="checklist-summary">
                    <div className="checklist-progress">
                      <span className="checklist-progress-label">Completion:</span>
                      <span className="checklist-progress-value">
                        {(() => {
                          const fields = [
                            task.featuredTitle,
                            task.featuredAlt,
                            task.widgetTitle,
                            task.metaTitle,
                            task.metaUrl,
                            task.metaDescription,
                            ...(task.type !== 'Blog' ? [task.instructionsToLink] : []),
                            task.htmlContent && task.htmlContent.trim().length > 0
                          ];
                          const completed = fields.filter(Boolean).length;
                          const total = fields.length;
                          return `${completed}/${total}`;
                        })()}
                      </span>
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
