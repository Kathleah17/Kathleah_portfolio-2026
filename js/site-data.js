/* Fallback profile and skills. Supabase replaces these when it is configured.
   Contact links live in js/contact.js. Projects live in js/projects.js. */
window.PROFILE = {
    headline: "Admin, IT support, and Power BI",
    tagline: "Data analytics, web and app development, content creation, and AI, including image and video generation and AI used with Power BI.",
    degree: "BS in Information Systems",
    experience: "Admin, IT support, Power BI development and analysis, data analytics, web and app development, content creation, and AI",
    about: [
        "Kathleah has a BS in Information Systems. Her work spans admin, IT support, Power BI development and analysis, data analytics, web and app development, content creation, and AI.",
        "That includes AI image generation, AI video generation, and AI used with Power BI. Web and app development sits alongside the data and content work."
    ]
};

window.EXPERTISE = [
    {
        slug: "web-app",
        title: "Web & App Development",
        intro: "TODO: add an introduction to web and app development.",
        body: "TODO: write about websites and apps. Known so far: HTML, CSS, JavaScript, and Dart. TODO: confirm whether the Dart work is Flutter.",
        highlights: ["HTML, CSS, and JavaScript", "Dart and JavaScript apps", "TODO: add a highlight you want public"],
        image_url: "",
        sort_order: 1,
        motif: "lines"
    },
    {
        slug: "power-bi",
        title: "Power BI & Data Analytics",
        intro: "TODO: add an introduction to Power BI development and analysis.",
        body: "TODO: describe the kind of Power BI reports you build and how analysis fits that work. Leave out numbers you cannot share.",
        highlights: ["Power BI development", "Power BI analysis", "TODO: add a highlight you want public"],
        image_url: "",
        sort_order: 2,
        motif: "dots"
    },
    {
        slug: "data-analytics",
        title: "Data Analytics",
        intro: "TODO: add an introduction to data analytics.",
        body: "TODO: describe how you approach analysis, separate from a specific employer or metric.",
        highlights: ["Data analytics", "TODO: add a highlight you want public"],
        image_url: "",
        sort_order: 3,
        motif: "smoke"
    },
    {
        slug: "social-content",
        title: "Social Media Content",
        intro: "TODO: add an introduction to social media content creation.",
        body: "TODO: describe the content you make. Name a channel only if you want it public.",
        highlights: ["Social media content creation", "TODO: add a highlight you want public"],
        image_url: "",
        sort_order: 4,
        motif: "waves"
    },
    {
        slug: "ai",
        title: "AI Image, Video, and AI with Power BI",
        intro: "TODO: add an introduction to AI image generation, AI video generation, and AI used with Power BI.",
        body: "TODO: describe how you use those tools. Name a product only if you want it public.",
        highlights: ["AI image generation", "AI video generation", "AI integrated with Power BI"],
        image_url: "",
        sort_order: 5,
        motif: "botanical"
    },
    {
        slug: "it-admin",
        title: "IT Support and Admin",
        intro: "TODO: add an introduction to IT support and admin work.",
        body: "TODO: describe the support and admin work you want visitors to understand.",
        highlights: ["IT support", "Admin", "TODO: add a highlight you want public"],
        image_url: "",
        sort_order: 6,
        motif: "rules"
    }
];

window.SKILLS = [
    { title: "Admin and IT support", items: ["Admin", "IT support"] },
    { title: "Power BI and data", items: ["Power BI development", "Power BI analysis", "Data analytics", "AI integrated with Power BI"] },
    { title: "Artificial intelligence", items: ["AI image generation", "AI video generation", "AI integrated with Power BI"] },
    { title: "Content", items: ["Social media content creation"] },
    {
        title: "Web and app development",
        items: ["HTML, CSS, and JavaScript", "App work in Dart and JavaScript", "TODO: confirm whether the Dart app uses Flutter"]
    }
];
