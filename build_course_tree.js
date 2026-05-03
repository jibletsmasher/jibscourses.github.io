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
<html lang="en" data-theme="dark">
    <head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-G6VPTWZXEV"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                dataLayer.push(arguments);
            }
            gtag('js', new Date());

            gtag('config', 'G-G6VPTWZXEV');
        </script>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${lessonCode} — ${lessonTitle} — Resources</title>
        <style>
            :root {
                --color-primary: #7f77dd;
                --color-primary-light: #eeedfe;
                --color-primary-dark: #3c3489;
                --color-primary-text: #534ab7;

                --color-teacher: #1d9e75;
                --color-teacher-light: #e1f5ee;
                --color-teacher-dark: #085041;
                --color-teacher-text: #0f6e56;

                --bg: #121124;
                --bg-accent: #1a1936;
                --card: #1f1d3d;
                --card-strong: #2b2955;
                --text: #ebf4ee;
                --muted: #9db4a8;
                --accent: var(--color-primary);
                --accent-strong: var(--color-primary-dark);
                --accent-soft: color-mix(
                    in srgb,
                    var(--color-primary) 24%,
                    var(--card)
                );
                --border: #28453d;
                --shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
                --radius-card: 28px;
                --radius-button: 16px;
                --font-serif: Georgia, 'Times New Roman', serif;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100vh;
                background: radial-gradient(
                        circle at top left,
                        var(--bg-accent),
                        transparent 34%
                    ),
                    linear-gradient(180deg, var(--bg), var(--bg-accent));
                color: var(--text);
                font-family: var(--font-serif);
                line-height: 1.5;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }

            .container {
                width: min(1000px, 100%);
                display: grid;
                gap: 2rem;
            }

            .header {
                text-align: center;
                display: grid;
                gap: 0.5rem;
            }

            .lesson-code {
                display: inline-block;
                padding: 0.35rem 1rem;
                background: var(--accent-soft);
                color: var(--color-primary);
                border-radius: 999px;
                font-size: 0.9rem;
                font-weight: 700;
                letter-spacing: 0.1em;
                margin: 0 auto;
                border: 1px solid var(--border);
            }

            h1 {
                font-size: clamp(2rem, 5vw, 3.5rem);
                margin: 0.5rem 0;
                line-height: 1.1;
            }

            .description {
                color: var(--muted);
                font-size: 1.1rem;
                max-width: 60ch;
                margin: 0 auto;
            }

            .resource-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
            }

            .resource-card {
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: var(--radius-card);
                padding: 2rem;
                text-decoration: none;
                color: inherit;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                transition:
                    transform 0.2s ease,
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;
                position: relative;
                overflow: hidden;
            }

            .resource-card:hover {
                transform: translateY(-8px);
                border-color: var(--color-primary);
                box-shadow: 0 12px 30px rgba(127, 119, 221, 0.2);
            }

            .resource-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: var(--accent);
                opacity: 0.3;
            }

            .resource-card.teacher::before {
                background: #ffcc00; /* Gold/Amber for attention resources */
            }

            .resource-card.pdf::before {
                background: #e24b4a; /* Red for PDF */
            }

            .icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }

            .resource-title {
                font-size: 1.4rem;
                font-weight: 700;
                margin: 0;
            }

            .resource-meta {
                font-size: 0.9rem;
                color: var(--muted);
                margin-top: auto;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.75rem 1.5rem;
                background: var(--card-strong);
                border: 1px solid var(--border);
                border-radius: var(--radius-button);
                font-weight: 700;
                margin-top: 1rem;
                transition: all 0.2s ease;
            }

            .resource-card:hover .btn {
                background: var(--accent);
                border-color: var(--accent);
                color: #fff;
            }

            .resource-card.teacher:hover .btn {
                background: var(--color-primary-dark);
                border-color: var(--color-primary);
            }

            .back-link {
                margin-top: 3rem;
                color: var(--muted);
                text-decoration: none;
                font-size: 0.95rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: color 0.2s ease;
            }

            .back-link:hover {
                color: var(--text);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header class="header">
                <span class="lesson-code">LESSON ${lessonCode}</span>
                <h1>${lessonTitle}</h1>
                <p class="description">
                    Access all resources for this lesson, including interactive content, teacher guides, and printable worksheets.
                </p>
            </header>

            <div class="resource-grid">
                ${files.interactiveHtml ? `
                <a href="${files.interactiveHtml}" class="resource-card">
                    <div class="icon">💻</div>
                    <h2 class="resource-title">Interactive Lesson</h2>
                    <p class="resource-meta">The core digital lesson for students.</p>
                    <div class="btn">Launch Lesson</div>
                </a>` : ''}

                ${files.teacherHtml ? `
                <a href="${files.teacherHtml}" class="resource-card teacher">
                    <div class="icon">🎓</div>
                    <h2 class="resource-title">Teacher's Guide</h2>
                    <p class="resource-meta">HTML guide with answers and debriefing questions.</p>
                    <div class="btn">View Guide</div>
                </a>` : ''}

                ${files.studentPdf ? `
                <a href="${files.studentPdf}" class="resource-card pdf">
                    <div class="icon">📝</div>
                    <h2 class="resource-title">Student Worksheet</h2>
                    <p class="resource-meta">Downloadable PDF for classroom work.</p>
                    <div class="btn">Download PDF</div>
                </a>` : ''}

                ${files.teacherPdf ? `
                <a href="${files.teacherPdf}" class="resource-card teacher pdf">
                    <div class="icon">📋</div>
                    <h2 class="resource-title">Teacher Resource</h2>
                    <p class="resource-meta">Complete teacher guide in PDF format.</p>
                    <div class="btn">Download PDF</div>
                </a>` : ''}
            </div>

            <a href="../../../index.html" class="back-link">
                ← Back to Course Overview
            </a>
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
