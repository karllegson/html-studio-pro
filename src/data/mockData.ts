import { Company, Task, TaskStatus, TaskType } from "../types";

export const companies: Company[] = [
  { id: "1", name: "OCBoston", contactLink: "https://ocboston.com/contact/" },
  { id: "2", name: "JMRoofing", contactLink: "https://jmroofing.com/contact-us/" },
  { id: "3", name: "Boston Movers", contactLink: "https://bostonmovers.com/contact/" },
  { id: "4", name: "CamdenRoofing", contactLink: "https://camdenroofing.com/contact/" },
  { id: "5", name: "GreenTech", contactLink: "https://greentech.com/reach-out/" },
  { id: "6", name: "Premium Panes", contactLink: "https://premiumpanes.com/contact/" },
  { id: "7", name: "Harbor Services", contactLink: "https://harborservices.com/contact/" },
  { id: "8", name: "Urban Lights", contactLink: "https://urbanlights.com/contact-us/" },
  { id: "9", name: "Tree Experts", contactLink: "https://treeexperts.com/get-a-quote/" },
  { id: "10", name: "Reliable Plumbing", contactLink: "https://reliableplumbing.com/contact/" }
];

export const sampleTasks: Task[] = [
  {
    id: "task1",
    companyId: "1",
    teamworkLink: "teamwork.com/tasks/123",
    type: TaskType.SUB_PAGE,
    status: TaskStatus.READY,
    notes: "Need this page by EOD",
    htmlContent: "<h1>Sample Page</h1><p>This is sample content.</p>",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task2",
    companyId: "3",
    teamworkLink: "teamwork.com/tasks/456",
    type: TaskType.LANDING_PAGE,
    status: TaskStatus.FINISHED,
    notes: "Landing page for summer campaign",
    htmlContent: "<h1>Moving Services</h1><p>Professional moving services in Boston.</p>",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task3",
    companyId: "2",
    teamworkLink: "teamwork.com/tasks/789",
    type: TaskType.BLOG,
    status: TaskStatus.RECENTLY_DELETED,
    notes: "Blog post about roofing maintenance",
    htmlContent: "<h1>Roofing Maintenance</h1><p>Tips for maintaining your roof.</p>",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const htmlTags: Record<string, string[]> = {
  "H1": ["<h1>", "</h1>"],
  "H2": ["<h2>", "</h2>"],
  "H3": ["<h3>", "</h3>"],
  "H4": ["<h4>", "</h4>"],
  "HR": ["<hr>", null],
  "b": ["<b>", "</b>"],
  "u": ["<u>", "</u>"],
  "i": ["<i>", "</i>"],
  "link": ['<a href="">', "</a>"],
  "img": ['<img src="" alt="">', null],
  "ul": ["<ul>", "</ul>"],
  "ol": ["<ol>", "</ol>"],
  "li": ["<li>", "</li>"],
  "code": ["<code>", "</code>"],
  "blockquote": ["<blockquote>", "</blockquote>"]
};

export const htmlComponents: Record<string, string> = {
  "CTA": `<div class="cta-container">
  <h3>Ready to Get Started?</h3>
  <p>Contact us today for a free consultation and quote.</p>
  <a href="{contactLink}" class="cta-button">Get in Touch</a>
</div>`,
  "Site Button": `<a href="{contactLink}" class="site-button">Learn More</a>`,
  "Image Card Left": `<div class="image-card left">
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
  "Quick Links": `<div class="quick-links">
  <h3>Quick Links</h3>
  <ul>
    <li><a href="#">Link 1</a></li>
    <li><a href="#">Link 2</a></li>
    <li><a href="#">Link 3</a></li>
  </ul>
</div>`,
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
</div>`
};
