import { Company, Task, TaskStatus, TaskType } from "../types";

export const htmlTags: Record<string, string[]> = {
  "H1": ["<h1>", "</h1>"],
  "H2": ["<h2>", "</h2>"],
  "H2 w/ ID": ['<h2 id="">', "</h2>"],
  "H3": ["<h3>", "</h3>"],
  "H4": ["<h4>", "</h4>"],
  "p": ["<p>", "</p>"],
  "HR": ["<hr>", null],
  "Short HR": ['<hr class="short">', null],
  "b": ["<strong>", "</strong>"],
  "u": ["<u>", "</u>"],
  "i": ["<em>", "</em>"],
  "b > i": ["<strong><em>", "</em></strong>"],
  "link": ["<a href=''>", "</a>"],
  "b-quote": ["<blockquote>", "</blockquote>"],
  "EN—Dash": ["&ndash;", null],
  "EM—Dash": ["&mdash;", null],
  "img": ['<img src="" alt="" title="">', null],
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
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Image Card Grid": `<div class="site-grid site-grid--3x1 triple"> <!-- Start Three Column Grid -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Image Card w/ Icon Grid": `<div class="site-grid site-grid--3x1 triple"> <!-- Start Three Column Grid -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Image Card w/ Ribbon": `<div class="site-grid site-grid--3x1 mini-cta-grid"> <!-- Start Three Column Grid -->
  
<div class="image-card"> <!-- Start Image Card -->
  <span class="image-card--ribbon" style="top: .8rem; left: -3.5rem; ">New</span>
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <span class="image-card--ribbon" style="top: .8rem; left: -3.5rem; ">New</span>
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
  
<div class="image-card"> <!-- Start Image Card -->
  <span class="image-card--ribbon" style="top: .8rem; left: -3.5rem; ">New</span>
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--icon">
    <div><i class="fas fa-house"></i></div>
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Mini CTA w/ Ribbon": `<div class="site-grid site-grid--3x1 mini-cta-grid"> <!-- Start Three Column Grid -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <span class="ribbon">New</span>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <span class="ribbon">New</span>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <span class="ribbon">New</span>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
</div> <!-- End Three Column Grid -->`,
  "3x1 Mini Icon CTA Grid": `<div class="site-grid site-grid--3x1 mini-cta-grid"> <!-- Start Three Column Grid -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
  
<div class="mini-cta">
  <div class="icon"><i class="fal fa-heart"></i></div>
  <hr>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn">
    <a href="#">CTA Text</a>
  </div>
</div> <!-- End Mini CTA -->
</div> <!-- End Three Column Grid -->`,
  "CTA": "[cta]",
  "CTA Button": `[cta-btn]`,
  "FAQs": `[faqs category=""]`,
  "Highlight": `<div class="highlight-box"> <!-- Start Highlight Box -->
  <h2>Who Does What Now?</h2>
  <p>Brooklet's Wet-Area Remodeling Experts: Jacuzzi Bath Remodel of Middle GA delivers specialized wet-area bathroom remodeling for Brooklet and the <a href="#">Middle Georgia Area</a>, combining faith-driven values with a commitment to quality.</p>
  <p>Why Choose Jacuzzi Bath Remodel of Middle GA? Expect a <a href="#">family-owned, faith-based business</a> guided by biblical principles, offering transparent, reliable, and customer-focused service from start to finish.</p>
  <p><a href="#"><strong>Shower Remodeling:</strong></a> Transform your outdated shower with premium, mold-resistant, and antimicrobial materials – installed by certified Jacuzzi experts in as little as 1-2 days.</p>
  <p><a href="#"><strong>Bathtub Remodeling:</strong></a> Upgrade your bathroom with a new bathtub or a <a href="#">tub-to-shower conversion</a>, using durable, nonporous Jacuzzi products designed for beauty and easy maintenance.</p>
  <p><a href="#"><strong>Quick, Hassle-Free Installations:</strong></a> Most projects are completed in just 1-2 days, minimizing disruption and maximizing comfort for Brooklet homeowners.</p>
  <p>Local Showroom Experience: Visit our <a href="#">Dublin, GA showroom</a> to see and feel Jacuzzi products before you decide, ensuring you get the perfect fit for your home.</p>
  <p>Customer Satisfaction Guaranteed: With over <a href="#">200 five-star reviews</a>, Jacuzzi Bath Remodel of Middle GA is trusted for personalized service, lasting results, and a straightforward remodeling experience.</p>
</div> <!-- End Highlight Box -->`,
  "Horizontal Image Card": `<div class="image-card single horizontal"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->`,
  "Icon Box Alt": `<div class="icon-box-alt"> <!-- Start Icon Box Alt -->
  <i class="icon fal fa-circle"></i>
  <h3 class="title">Title</h3>
  <hr>
  <div class="content">
    <p>Text</p>
    <div class="site-btn"><a href="#">Learn More</a></div>
  </div>
</div> <!-- End Icon Box Alt -->`,
  "Icon Box Alt 2": `<div class="icon-box-alt icon-box-alt-2"> <!-- Start Icon Box Alt -->
  <div class="icon">
    <i class="icon fal fa-circle"></i>
  </div>
  <div class="content">
    <h3 class="title">Title</h3>
    <p>Text</p>
    <div class="site-btn"><a href="#">Learn More</a></div>
  </div>
</div> <!-- End Icon Box Alt -->`,
  "Icon CTA Box": `<div class="icon-cta-box"> <!-- Start Icon CTA Box -->
  <i class="icon-cta-box--icon fal fa-phone"></i>
  <h3 class="title">Title</h3>
  <p>Body</p>
  <div class="site-btn"><a href="/">CTA</a></div>
</div> <!-- End Icon CTA Box -->`,
  "Image Card": `<div class="image-card single"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->`,
  "Image Card Left": `<div class="image-card single left--image"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->`,
  "Image Card Right": `<div class="image-card single right--image"> <!-- Start Image Card -->
  <div class="image-card--image">
    <img src="" alt="" title="">
  </div>
  <div class="image-card--content">
    <h3 class="title">Title</h3>
    <p>Body</p>
    <div class="site-btn"><a href="/">CTA</a></div>
  </div>
</div> <!-- End Image Card -->`,
  "Image Highlights": `<div class='image-highlights'>Image Highlights Placeholder</div>`,
  "Quick Links": `<div class="quick-links" id="quick-links" data-sticky-active-offset=""> <!--Start Quick Links-->
  
  <div class="title">Quick Links</div>
  
  <div class="links">
    
    <a href="#linkid" data-sticky-label="">Link 1</a>
    <a href="#linkid" data-sticky-label="">Link 2</a>
    <a href="#linkid" data-sticky-label="">Link 3</a>
    <a href="#linkid" data-sticky-label="">Link 4</a>
    <a href="#linkid" data-sticky-label="">Link 5</a>
    <a href="#linkid" data-sticky-label="">Link 6</a>
    
  </div>
  
</div> <!--End Quick Links-->`,
  "Related Posts": `<div class="related-links">  <!--Start Related Posts-->
  
  <h5>Related Posts</h5> 
  <ul>
    
    <li> <a href="link">First Related Post Title</a> </li>
    <li> <a href="link">Second Related Post Title</a> </li>
    <li> <a href="link">Third Related Post Title</a> </li>
    
  </ul>
</div> <!--End Related Posts-->`,
  "Reviews": `[reviews amount="" category=""]`,
  "Site Button": `<div class="site-btn">
  <a href="#">Text</a>
</div>`,
  "Staff": `<div class='staff'>Staff Placeholder</div>`,
  "Tabbed Content": `<div class="site-tabs">
  <div class="tabs" role="tablist">
    <div class="tab active" tabindex="0" role="tab">Tub-to-Shower Conversion</div>
    <div class="tab" role="tab">Bathroom Accessibility</div>
    <!-- Add/remove tabs as needed -->
  </div>

  <div class="tab-contents">
    <div class="content" role="tabpanel">
      <h4>Tub-to-Shower Conversion</h4>
      <p>Transform your old bathtub into a spacious, modern shower with a premium tub-to-shower conversion. It's Perfect for homeowners seeking better accessibility and a fresh look. Our solutions offer:</p>
      <ul>
        <li>Improved safety and convenience</li>
        <li>Custom designs to fit your space</li>
        <li>Fast, professional installation</li>
      </ul>
      <p>Upgrade your bathroom's function and style in as little as 1-2 days.</p>
      <a href="#" class="button">Learn About Tub-To-Shower Conversions</a>
    </div>

    <div class="content" role="tabpanel">
      <h4>Bathroom Accessibility</h4>
      <p>Create a safe and accessible bathroom environment with our accessibility solutions designed for comfort and independence.</p>
      <ul>
        <li>ADA-compliant features</li>
        <li>Walk-in tubs and showers</li>
        <li>Grab bars and safety features</li>
      </ul>
      <p>Make your bathroom accessible and safe for all family members.</p>
      <a href="#" class="button">Explore Accessibility Options</a>
    </div>

    <!-- Add/remove .content blocks for more/fewer tabs -->
  </div>
</div>`,
  "Tel": `[tel]`
};
