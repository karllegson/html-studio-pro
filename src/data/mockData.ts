import { Company, Task, TaskStatus, TaskType } from "../types";

export const htmlTags: Record<string, string[]> = {
  "H1": ["<h1>", "</h1>"],
  "H2": ["<h2>", "</h2>"],
  "H2 w/ ID": ["<h2 id=''>", "</h2>"],
  "H3": ["<h3>", "</h3>"],
  "H4": ["<h4>", "</h4>"],
  "p": ["<p>", "</p>"],
  "HR": ["<hr>", null],
  "Short HR": ["<hr class='short'>", null],
  "b": ["<strong>", "</strong>"],
  "u": ["<u>", "</u>"],
  "i": ["<em>", "</em>"],
  "b > i": ["<strong><em>", "</em></strong>"],
  "link": ["<a href=''>", "</a>"],
  "b-quote": ["<blockquote>", "</blockquote>"],
  "EN—Dash": ["&ndash;", null],
  "EM—Dash": ["&mdash;", null],
  "img": ['<img src="" alt="">', null],
  "ul ✓": [
    `<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>`,
    null
  ],
  "ul ×": [
    `<ul class="x">\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>`,
    null
  ],
  "ol": [
    `<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ol>`,
    null
  ],
  "li": ["<li>", "</li>"],
};

export const htmlComponents: Record<string, string> = {
  "2x1 Grid": `<div class="site-grid standard site-grid--2x1"> <!-- Start Two Column Grid -->
  <div> <!-- Start Grid Item -->
    <h3>Title</h3>
    <p>Text</p>
    <div class="site-btn"><a href="/">CTA Text</a></div>
  </div> <!-- End Grid Item -->
  <div> <!-- Start Grid Item -->
    <h3>Title</h3>
    <p>Text</p>
    <div class="site-btn"><a href="/">CTA Text</a></div>
  </div> <!-- End Grid Item -->
</div> <!-- End Two Column Grid -->`,
  "2x1 Image Card Grid": `<div class="site-grid site-grid--2x1 double"> <!-- Start Three Column Grid -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Image Card Grid": `<div class='image-card-grid-3x1'>3x1 Image Card Grid Placeholder</div>`,
  "Image Card w/ Icon Grid": `<div class='image-card-icon-grid'>Image Card w/ Icon Grid Placeholder</div>`,
  "3x1 Image Card w/ Ribbon": `<div class='image-card-ribbon-3x1'>3x1 Image Card w/ Ribbon Placeholder</div>`,
  "3x1 Mini CTA w/ Ribbon": `<div class='mini-cta-ribbon-3x1'>3x1 Mini CTA w/ Ribbon Placeholder</div>`,
  "3x1 Mini Icon CTA Grid": `<div class='mini-icon-cta-grid-3x1'>3x1 Mini Icon CTA Grid Placeholder</div>`,
  "Accordion": `<div class="accordion">
  <div class="accordion-item">
    <h3 class="accordion-header">Section 1</h3>
    <div class="accordion-content">
      <p>Content for section 1.</p>
    </div>
  </div>
  <div class="accordion-item">
    <h3 class="accordion-header">Section 2</h3>
    <div class="accordion-content">
      <p>Content for section 2.</p>
    </div>
  </div>
</div>`,
  "Auto BR Fix": `<div class='auto-br-fix'>Auto BR Fix Placeholder</div>`,
  "Auto Quicks Link ID": `<div class='auto-quicks-link-id'>Auto Quicks Link ID Placeholder</div>`,
  "Badge CTA": `<div class='badge-cta'>Badge CTA Placeholder</div>`,
  "Badge CTA (no image)": `<div class='badge-cta-no-image'>Badge CTA (no image) Placeholder</div>`,
  "Before After Slider": `<div class='before-after-slider'>Before After Slider Placeholder</div>`,
  "CTA": `<div class="cta-container">
  <h3>Ready to Get Started?</h3>
  <p>Contact us today for a free consultation and quote.</p>
  <a href="{contactLink}" class="cta-button">Get in Touch</a>
</div>`,
  "CTA Button": `<a href="{contactLink}" class="cta-button">CTA Button</a>`,
  "FAQs": `<div class="faq-section">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item">
    <h3>Question 1?</h3>
    <p>Answer to question 1.</p>
  </div>
  <div class="faq-item">
    <h3>Question 2?</h3>
    <p>Answer to question 2.</p>
  </div>
</div>`,
  "Highlight Box": `<div class='highlight-box'>Highlight Box Placeholder</div>`,
  "Horizontal Image Card": `<div class='horizontal-image-card'>Horizontal Image Card Placeholder</div>`,
  "Icon Box Alt": `<div class='icon-box-alt'>Icon Box Alt Placeholder</div>`,
  "Icon Box Alt 2": `<div class='icon-box-alt-2'>Icon Box Alt 2 Placeholder</div>`,
  "Icon CTA Box": `<div class='icon-cta-box'>Icon CTA Box Placeholder</div>`,
  "Image Card": `<div class='image-card'>Image Card Placeholder</div>`,
  "Image Card Left": `<div class="image-f left">
  <img src="image.jpg" alt="Description">
  <div class="content">
    <h3>Title Here</h3>
    <p>Description text goes here.</p>
  </div>
</div>`,
  "Image Card Right": `<div class="image-card right">
  <div class="content">
    <h3>Title Here</h3>
    <p>Description text goes here.</p>
  </div>
  <img src="image.jpg" alt="Description">
</div>`,
  "Image Highlights": `<div class='image-highlights'>Image Highlights Placeholder</div>`,
  "Quick Links": `<div class="quick-links">
  <h3>Quick Links</h3>
  <ul>
    <li><a href="#">Link 1</a></li>
    <li><a href="#">Link 2</a></li>
    <li><a href="#">Link 3</a></li>
  </ul>
</div>`,
  "Related Posts": `<div class='related-posts'>Related Posts Placeholder</div>`,
  "Reviews": `<div class="reviews">
  <h2>Customer Reviews</h2>
  <div class="review-item">
    <div class="stars">★★★★★</div>
    <p>"Great service! Highly recommend."</p>
    <p class="reviewer">- John D.</p>
  </div>
  <div class="review-item">
    <div class="stars">★★★★★</div>
    <p>"Professional and efficient."</p>
    <p class="reviewer">- Sarah M.</p>
  </div>
</div>`,
  "Scrolling Gallery": `<div class="scrolling-gallery">
  <div class="gallery-container">
    <img src="image1.jpg" alt="Gallery Image 1">
    <img src="image2.jpg" alt="Gallery Image 2">
    <img src="image3.jpg" alt="Gallery Image 3">
    <img src="image4.jpg" alt="Gallery Image 4">
  </div>
</div>`,
  "Site Button": `<a href="{contactLink}" class="site-button">Learn More</a>`,
  "Staff": `<div class='staff'>Staff Placeholder</div>`,
  "Tabbed Content": `<div class="tabbed-content">
  <div class="tabs">
    <button class="tab-button active" data-tab="tab1">Tab 1</button>
    <button class="tab-button" data-tab="tab2">Tab 2</button>
    <button class="tab-button" data-tab="tab3">Tab 3</button>
  </div>
  <div class="tab-content active" id="tab1">
    <p>Content for tab 1</p>
  </div>
  <div class="tab-content" id="tab2">
    <p>Content for tab 2</p>
  </div>
  <div class="tab-content" id="tab3">
    <p>Content for tab 3</p>
  </div>
</div>`,
  "Tagged Posts": `<div class='tagged-posts'>Tagged Posts Placeholder</div>`,
  "Tel": `<a href='tel:' class='tel-link'>Tel Placeholder</a>`
};
