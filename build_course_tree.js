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
        
        // We only consider a directory a course if it has an index.html or Unit folders.
        // To be safe, let's check if it has any Unit folders
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
                    
                    // Try to find index.html
                    const indexPath = path.join(lessonPathFull, 'index.html');
                    
                    // Try to find any .html file if index.html doesn't exist
                    let htmlFiles = fs.readdirSync(lessonPathFull).filter(f => f.endsWith('.html'));
                    let mainHtml = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0];
                    
                    let title = lessonFolder;
                    if (mainHtml) {
                        const extractedTitle = getTitleFromHtml(path.join(lessonPathFull, mainHtml));
                        if (extractedTitle) {
                            title = extractedTitle;
                        } else if (mainHtml !== 'index.html') {
                            title = formatTitle(mainHtml.replace('.html', ''));
                        }
                    }

                    // Calculate relative path for href
                    const relativePath = `${unitName}/${moduleName}/${lessonFolder}/${mainHtml || 'index.html'}`;
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

        // ----------------------------------------------------
        // Update the course's index.html with the new courseTree
        // ----------------------------------------------------
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
        } else {
            console.log(`  Warning: ${courseName}/index.html does not exist. Please create it with markers.`);
        }
    }

    // ----------------------------------------------------
    // Update directory.html with course cards
    // ----------------------------------------------------
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
                // Formatting course title for display
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

            courseCardsHtml += `                `; // Indent for the end marker
            
            const newContent = htmlContent.substring(0, startIndex + startMarker.length) + 
                               courseCardsHtml + 
                               htmlContent.substring(endIndex);
            
            fs.writeFileSync(directoryHtmlPath, newContent, 'utf8');
            console.log(`\nUpdated directory.html with ${courseDataList.length} course(s).`);
        } else {
            console.log('\nWarning: Could not find COURSES START/END markers in directory.html');
        }
    }

    console.log('Build complete!');
}

build();
