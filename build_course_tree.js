const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const IGNORE_DIRS = ['.git', 'node_modules'];

// Helper to extract title from index.html
function getTitleFromHtml(htmlPath) {
    if (!fs.existsSync(htmlPath)) return null;
    const content = fs.readFileSync(htmlPath, 'utf8');
    const match = content.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : null;
}

// Format string (e.g. "1.1.1-some-lesson" -> "Some Lesson")
function formatTitle(str) {
    return str
        .replace(/^[0-9\.\-]+\s*/, '') // Remove leading numbers and dashes
        .replace(/-/g, ' ')            // Replace dashes with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Title case
}

// Natural sort function
function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Template for lesson index.html
function generateLessonIndex(lessonCode, lessonTitle, files) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-G6VPTWZXEV"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-G6VPTWZXEV');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lessonCode} — ${lessonTitle} | Jib's Courses</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-main: #050505;
            --bg-surface: #121212;
            --text-primary: #f4f4f5;
            --text-secondary: #a1a1aa;
            
            --accent-color: #8b5cf6;
            --accent-hover: #a78bfa;
            --gradient-primary: linear-gradient(135deg, #6d28d9 0%, #d946ef 100%);
            --gradient-subtle: linear-gradient(135deg, rgba(109, 40, 217, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%);
            
            --border-color: rgba(255, 255, 255, 0.1);
            
            --font-display: 'Outfit', sans-serif;
            --font-body: 'Inter', sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-body);
            background-color: var(--bg-main);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        /* Abstract Background Elements */
        .bg-glow {
            position: absolute;
            width: 600px;
            height: 600px;
            background: var(--gradient-primary);
            filter: blur(120px);
            border-radius: 50%;
            opacity: 0.15;
            z-index: -1;
            top: -200px;
            left: -200px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        header {
            padding: 2rem 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-family: var(--font-display);
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo span {
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav-cta {
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .nav-cta:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .hero {
            padding: 4rem 0 2rem;
            text-align: center;
            position: relative;
        }

        .hero-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            background: var(--gradient-subtle);
            border: 1px solid rgba(139, 92, 246, 0.2);
            color: var(--accent-hover);
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 2rem;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .hero h1 {
            font-family: var(--font-display);
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            letter-spacing: -1px;
        }

        .hero p {
            font-size: 1.125rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto;
        }

        .resource-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            padding: 3rem 0 6rem;
        }

        .resource-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 2.5rem;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            text-decoration: none;
            color: inherit;
            display: flex;
            flex-direction: column;
        }

        .resource-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient-subtle);
            z-index: 0;
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .resource-card:hover {
            transform: translateY(-8px);
            border-color: rgba(139, 92, 246, 0.4);
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
        }

        .resource-card:hover::before {
            opacity: 1;
        }

        /* Interactive Lesson: Green */
        .resource-card.interactive::before {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
        }

        .resource-card.interactive:hover {
            border-color: rgba(34, 197, 94, 0.4);
        }

        /* Teacher Guide HTML: Purple (default gradient) */

        /* Student Worksheet PDF: Red */
        .resource-card.pdf::before {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 63, 94, 0.1) 100%);
        }

        .resource-card.pdf:hover {
            border-color: rgba(239, 68, 68, 0.4);
        }

        /* Teacher Resource PDF: Yellow */
        .resource-card.teacher::before {
            background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
        }

        .resource-card.teacher:hover {
            border-color: rgba(234, 179, 8, 0.4);
        }

        .card-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .icon {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
        }

        .resource-title {
            font-family: var(--font-display);
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }

        .resource-meta {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.5;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: 9999px;
            font-weight: 600;
            color: var(--text-primary);
            margin-top: auto;
            transition: all 0.3s ease;
        }

        /* Default hover btn: purple */
        .resource-card:hover .btn {
            background: var(--gradient-primary);
            border-color: transparent;
            color: white;
        }

        .resource-card.interactive:hover .btn {
            background: linear-gradient(135deg, #22c55e, #10b981);
            border-color: transparent;
            color: white;
        }

        .resource-card.pdf:hover .btn {
            background: linear-gradient(135deg, #ef4444, #f43f5e);
            border-color: transparent;
            color: white;
        }

        .resource-card.teacher:hover .btn {
            background: linear-gradient(135deg, #eab308, #f59e0b);
            border-color: transparent;
            color: white;
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="container">
        <header>
            <a href="../../../index.html" class="logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#paint0_linear)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <defs>
                        <linearGradient id="paint0_linear" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#6d28d9"/>
                            <stop offset="1" stop-color="#d946ef"/>
                        </linearGradient>
                    </defs>
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                Jib's <span>Courses</span>
            </a>
            <a href="../../index.html" class="nav-cta">Back to Course</a>
        </header>

        <main>
            <section class="hero">
                <div class="hero-badge">Lesson ${lessonCode}</div>
                <h1>${lessonTitle}</h1>
                <p>Access all resources for this lesson, including interactive content, teacher guides, and printable worksheets.</p>
            </section>

            <div class="resource-grid">
                ${files.interactiveHtml ? `
                <a href="${files.interactiveHtml}" class="resource-card interactive">
                    <div class="card-content">
                        <div class="icon">💻</div>
                        <h2 class="resource-title">Interactive Lesson</h2>
                        <p class="resource-meta">The core digital lesson for students.</p>
                        <div class="btn">Launch Lesson</div>
                    </div>
                </a>` : ''}

                ${files.teacherHtml ? `
                <a href="${files.teacherHtml}" class="resource-card">
                    <div class="card-content">
                        <div class="icon">🎓</div>
                        <h2 class="resource-title">Teacher's Guide</h2>
                        <p class="resource-meta">Abridged HTML guide with answers and debriefing questions.</p>
                        <div class="btn">View Guide</div>
                    </div>
                </a>` : ''}

                ${files.studentPdf ? `
                <a href="${files.studentPdf}" class="resource-card pdf">
                    <div class="card-content">
                        <div class="icon">📝</div>
                        <h2 class="resource-title">Student Worksheet</h2>
                        <p class="resource-meta">Downloadable PDF for classroom work.</p>
                        <div class="btn">Download PDF</div>
                    </div>
                </a>` : ''}

                ${files.teacherPdf ? `
                <a href="${files.teacherPdf}" class="resource-card teacher">
                    <div class="card-content">
                        <div class="icon">📋</div>
                        <h2 class="resource-title">Teacher Resource</h2>
                        <p class="resource-meta">Comprehensive teacher guide in PDF format.</p>
                        <div class="btn">Download PDF</div>
                    </div>
                </a>` : ''}
            </div>
        </main>
    </div>
</body>
</html>`;
}

function build() {
    console.log('Starting dynamic course build...');

    const items = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    const courses = items.filter(item => 
        item.isDirectory() && 
        !item.name.startsWith('.') && 
        !IGNORE_DIRS.includes(item.name)
    ).map(item => item.name);

    const courseDataList = [];

    for (const courseName of courses) {
        console.log(`\nProcessing course: ${courseName}`);
        const coursePath = path.join(ROOT_DIR, courseName);
        
        const courseItems = fs.readdirSync(coursePath, { withFileTypes: true });
        const units = courseItems
            .filter(item => item.isDirectory() && item.name.toLowerCase().includes('unit'))
            .map(item => item.name)
            .sort(naturalSort);

        if (units.length === 0) {
            console.log(`  Skipping ${courseName} (no Unit folders found)`);
            continue;
        }

        const courseTree = [];

        for (const unitName of units) {
            const unitPath = path.join(coursePath, unitName);
            const unitModules = fs.readdirSync(unitPath, { withFileTypes: true })
                .filter(item => item.isDirectory() && item.name.toLowerCase().includes('module'))
                .map(item => item.name)
                .sort(naturalSort);

            const modulesData = [];

            for (const moduleName of unitModules) {
                const modulePath = path.join(unitPath, moduleName);
                const moduleLessons = fs.readdirSync(modulePath, { withFileTypes: true })
                    .filter(item => item.isDirectory() && /^[0-9\.]+/.test(item.name)) // Matches "1.1.1" etc.
                    .map(item => item.name)
                    .sort(naturalSort);

                const lessonsData = [];

                for (const lessonFolder of moduleLessons) {
                    const lessonPathFull = path.join(modulePath, lessonFolder);
                    
                    const filesInLesson = fs.readdirSync(lessonPathFull).filter(f => !fs.statSync(path.join(lessonPathFull, f)).isDirectory());
                    
                    let interactiveHtml = null;
                    let teacherHtml = null;
                    let studentPdf = null;
                    let teacherPdf = null;

                    for (const file of filesInLesson) {
                        const fileLower = file.toLowerCase();
                        if (fileLower === 'index.html') continue;
                        
                        if (fileLower.endsWith('.html')) {
                            if (fileLower.includes('teacher-guide') || fileLower.includes('teacher')) {
                                teacherHtml = file;
                            } else {
                                interactiveHtml = file;
                            }
                        } else if (fileLower.endsWith('.pdf')) {
                            if (fileLower.includes('teacher-guide') || fileLower.includes('teacher')) {
                                teacherPdf = file;
                            } else {
                                studentPdf = file;
                            }
                        }
                    }

                    // Extract title
                    let title = lessonFolder;
                    if (interactiveHtml) {
                        const fullPath = path.join(lessonPathFull, interactiveHtml);
                        const extracted = getTitleFromHtml(fullPath);
                        title = extracted || formatTitle(interactiveHtml.replace('.html', ''));
                    } else if (teacherHtml) {
                        const fullPath = path.join(lessonPathFull, teacherHtml);
                        const extracted = getTitleFromHtml(fullPath);
                        title = extracted ? extracted.replace(' - Teacher Guide', '').trim() : formatTitle(teacherHtml.replace('.html', ''));
                    }

                    // Generate the lesson's index.html
                    const indexHtmlContent = generateLessonIndex(lessonFolder, title, {
                        interactiveHtml,
                        teacherHtml,
                        studentPdf,
                        teacherPdf
                    });
                    
                    fs.writeFileSync(path.join(lessonPathFull, 'index.html'), indexHtmlContent, 'utf8');

                    // Calculate relative path for href
                    const relativePath = `${unitName}/${moduleName}/${lessonFolder}/index.html`;
                    const encodedHref = encodeURI(relativePath);

                    lessonsData.push({
                        code: lessonFolder,
                        title: title,
                        path: relativePath,
                        href: encodedHref
                    });
                }

                modulesData.push({
                    title: moduleName,
                    lessons: lessonsData
                });
            }

            courseTree.push({
                title: unitName,
                modules: modulesData
            });
        }

        courseDataList.push({
            name: courseName,
            folder: courseName,
            tree: courseTree
        });

        // Update the course's index.html with the new courseTree
        const courseIndexHtmlPath = path.join(coursePath, 'index.html');
        if (fs.existsSync(courseIndexHtmlPath)) {
            let htmlContent = fs.readFileSync(courseIndexHtmlPath, 'utf8');
            const startMarker = '// --- BEGIN DYNAMIC COURSE TREE ---';
            const endMarker = '// --- END DYNAMIC COURSE TREE ---';
            
            const startIndex = htmlContent.indexOf(startMarker);
            const endIndex = htmlContent.indexOf(endMarker);

            if (startIndex !== -1 && endIndex !== -1) {
                const newTreeJs = `\n        const courseTree = ${JSON.stringify(courseTree, null, 12)};\n        `;
                const newContent = htmlContent.substring(0, startIndex + startMarker.length) + 
                                   newTreeJs + 
                                   htmlContent.substring(endIndex);
                
                fs.writeFileSync(courseIndexHtmlPath, newContent, 'utf8');
                console.log(`  Updated ${courseName}/index.html`);
            } else {
                console.log(`  Warning: Could not find DYNAMIC COURSE TREE markers in ${courseName}/index.html`);
            }
        }
    }

    // Update directory.html
    const directoryHtmlPath = path.join(ROOT_DIR, 'directory.html');
    if (fs.existsSync(directoryHtmlPath)) {
        let htmlContent = fs.readFileSync(directoryHtmlPath, 'utf8');
        const startMarker = '<!-- COURSES START -->';
        const endMarker = '<!-- COURSES END -->';
        
        const startIndex = htmlContent.indexOf(startMarker);
        const endIndex = htmlContent.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            let courseCardsHtml = '\n';
            
            for (const course of courseDataList) {
                const displayTitle = formatTitle(course.name);
                courseCardsHtml += `                <a href="${encodeURI(course.folder)}/index.html" class="course-card">\n`;
                courseCardsHtml += `                    <div class="course-content">\n`;
                courseCardsHtml += `                        <span class="course-badge">Course</span>\n`;
                courseCardsHtml += `                        <h2>${displayTitle}</h2>\n`;
                courseCardsHtml += `                        <p>Explore the complete curriculum, units, modules, and lessons for this course.</p>\n`;
                courseCardsHtml += `                        <div class="course-footer">\n`;
                courseCardsHtml += `                            View Curriculum\n`;
                courseCardsHtml += `                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n`;
                courseCardsHtml += `                                <line x1="5" y1="12" x2="19" y2="12"></line>\n`;
                courseCardsHtml += `                                <polyline points="12 5 19 12 12 19"></polyline>\n`;
                courseCardsHtml += `                            </svg>\n`;
                courseCardsHtml += `                        </div>\n`;
                courseCardsHtml += `                    </div>\n`;
                courseCardsHtml += `                </a>\n`;
            }

            courseCardsHtml += `                `; 
            
            const newContent = htmlContent.substring(0, startIndex + startMarker.length) + 
                               courseCardsHtml + 
                               htmlContent.substring(endIndex);
            
            fs.writeFileSync(directoryHtmlPath, newContent, 'utf8');
            console.log(`\nUpdated directory.html with ${courseDataList.length} course(s).`);
        }
    }

    console.log('Build complete!');
}

build();
