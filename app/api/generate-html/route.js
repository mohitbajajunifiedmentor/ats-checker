// app/api/generate-pdf/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { resumeData, templateType = 'professional' } = await req.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      );
    }

    // Generate HTML resume template
    const htmlContent = generateResumeHTML(resumeData, templateType);

    return NextResponse.json({
      success: true,
      htmlContent,
      filename: `${(resumeData.name || 'resume').replace(/\s+/g, '_')}_${templateType}.html`
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}

function generateResumeHTML(data, templateType) {
  const templates = {
    professional: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.name || 'Resume'} - Professional</title>
          <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: white; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
              .name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
              .contact { font-size: 14px; color: #666; margin-bottom: 20px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
              .job-title { font-weight: bold; font-size: 16px; }
              .company { color: #666; font-style: italic; }
              .duration { color: #666; font-size: 14px; }
              .skills { display: flex; flex-wrap: wrap; gap: 8px; }
              .skill { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
              .education-item, .experience-item { margin-bottom: 15px; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="name">${data.name || 'Your Name'}</div>
              <div class="contact">
                  ${data.email ? `<span>${data.email}</span>` : ''}
                  ${data.phone ? `<span> | ${data.phone}</span>` : ''}
                  ${data.address ? `<br>${data.address}</br>` : ''}
                  ${data.linkedin ? `<br><a href="${data.linkedin}">LinkedIn</a></span>` : ''}
                  ${data.github ? `<span> | <a href="${data.github}">GitHub</a></span>` : ''}
                  ${data.portfolio ? `<span> | <a href="${data.portfolio}">Portfolio</a></span>` : ''}
              </div>
          </div>

          ${data.summary ? `
          <div class="section">
              <div class="section-title">Professional Summary</div>
              <p>${data.summary}</p>
          </div>
          ` : ''}

          ${data.experience && data.experience.length > 0 ? `
          <div class="section">
              <div class="section-title">Professional Experience</div>
              ${data.experience.map(exp => `
                  <div class="experience-item">
                      <div class="job-title">${exp.title || 'Position'}</div>
                      <div class="company">${exp.company || 'Company'} | ${exp.duration || 'Duration'}</div>
                      ${exp.description ? `<p>${exp.description}</p>` : ''}
                  </div>
              `).join('')}
          </div>
          ` : ''}

          ${data.education && data.education.length > 0 ? `
          <div class="section">
              <div class="section-title">Education</div>
              ${data.education.map(edu => `
                  <div class="education-item">
                      <div class="job-title">${edu.degree || 'Degree'}</div>
                      <div class="company">${edu.institution || 'Institution'} | ${edu.year || 'Year'}</div>
                      ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
                  </div>
              `).join('')}
          </div>
          ` : ''}

          ${data.skills && data.skills.length > 0 ? `
          <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills">
                  ${data.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
          </div>
          ` : ''}

          ${data.projects && data.projects.length > 0 ? `
          <div class="section">
              <div class="section-title">Projects</div>
              ${data.projects.map(project => `
                  <div class="experience-item">
                      <div class="job-title">${project.name || 'Project'}</div>
                      <div class="company">${project.technologies ? project.technologies.join(', ') : ''}</div>
                      ${project.description ? `<p>${project.description}</p>` : ''}
                  </div>
              `).join('')}
          </div>
          ` : ''}

          ${data.certifications && data.certifications.length > 0 ? `
          <div class="section">
              <div class="section-title">Certifications</div>
              ${data.certifications.map(cert => `
                  <div class="experience-item">
                      <div class="job-title">${cert.name || 'Certification'}</div>
                      <div class="company">${cert.issuer || 'Issuer'} | ${cert.year || 'Year'}</div>
                  </div>
              `).join('')}
          </div>
          ` : ''}
      </body>
      </html>
    `,

    modern: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.name || 'Resume'} - Modern</title>
          <style>
              body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 30px; background: #f8fafc; color: #334155; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 40px; }
              .name { font-size: 32px; font-weight: bold; color: #0f172a; margin-bottom: 15px; }
              .contact { display: flex; justify-content: center; gap: 20px; font-size: 14px; color: #64748b; flex-wrap: wrap; }
              .section { margin-bottom: 35px; }
              .section-title { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #3b82f6; }
              .job-title { font-weight: bold; font-size: 16px; color: #0f172a; }
              .company { color: #64748b; font-weight: 500; }
              .duration { color: #94a3b8; font-size: 14px; }
              .skills { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
              .skill { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 8px 12px; border-radius: 20px; text-align: center; font-size: 12px; font-weight: 500; }
              .experience-item, .education-item { margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="name">${data.name || 'Your Name'}</div>
                  <div class="contact">
                      ${data.email ? `<span>${data.email}</span>` : ''}
                      ${data.phone ? `<span>${data.phone}</span>` : ''}
                      ${data.linkedin ? `<span><a href="${data.linkedin}">LinkedIn</a></span>` : ''}
                      ${data.github ? `<span><a href="${data.github}">GitHub</a></span>` : ''}
                  </div>
              </div>

              ${data.summary ? `
              <div class="section">
                  <div class="section-title">About</div>
                  <p style="line-height: 1.6;">${data.summary}</p>
              </div>
              ` : ''}

              ${data.experience && data.experience.length > 0 ? `
              <div class="section">
                  <div class="section-title">Experience</div>
                  ${data.experience.map(exp => `
                      <div class="experience-item">
                          <div class="job-title">${exp.title || 'Position'}</div>
                          <div class="company">${exp.company || 'Company'}</div>
                          <div class="duration">${exp.duration || 'Duration'}</div>
                          ${exp.description ? `<p style="margin-top: 10px; line-height: 1.5;">${exp.description}</p>` : ''}
                      </div>
                  `).join('')}
              </div>
              ` : ''}

              ${data.education && data.education.length > 0 ? `
              <div class="section">
                  <div class="section-title">Education</div>
                  ${data.education.map(edu => `
                      <div class="education-item">
                          <div class="job-title">${edu.degree || 'Degree'}</div>
                          <div class="company">${edu.institution || 'Institution'}</div>
                          <div class="duration">${edu.year || 'Year'}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
                      </div>
                  `).join('')}
              </div>
              ` : ''}

              ${data.skills && data.skills.length > 0 ? `
              <div class="section">
                  <div class="section-title">Skills</div>
                  <div class="skills">
                      ${data.skills.map(skill => `<div class="skill">${skill}</div>`).join('')}
                  </div>
              </div>
              ` : ''}

              ${data.projects && data.projects.length > 0 ? `
              <div class="section">
                  <div class="section-title">Projects</div>
                  ${data.projects.map(project => `
                      <div class="experience-item">
                          <div class="job-title">${project.name || 'Project'}</div>
                          <div class="company">${project.technologies ? project.technologies.join(' • ') : ''}</div>
                          ${project.description ? `<p style="margin-top: 10px; line-height: 1.5;">${project.description}</p>` : ''}
                      </div>
                  `).join('')}
              </div>
              ` : ''}
          </div>
      </body>
      </html>
    `,

    technical: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.name || 'Resume'} - Technical</title>
          <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 25px; background: #0f172a; color: #e2e8f0; }
              .container { max-width: 900px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 30px; }
              .name { font-size: 28px; font-weight: bold; color: #60a5fa; margin-bottom: 15px; }
              .contact { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 16px; font-weight: bold; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
              .code-block { background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 15px; margin: 10px 0; font-family: 'Courier New', monospace; }
              .skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
              .skill-item { background: #1e293b; border: 1px solid #334155; padding: 8px 12px; border-radius: 4px; text-align: center; font-size: 12px; }
              .project-item { margin-bottom: 20px; }
              .project-title { color: #60a5fa; font-weight: bold; }
              .tech-stack { color: #94a3b8; font-size: 12px; margin-bottom: 8px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="name">${data.name || 'Your Name'}</div>
                  <div class="contact">
                      ${data.email ? `${data.email}` : ''}
                      ${data.phone ? ` | ${data.phone}` : ''}
                      ${data.linkedin ? ` | ${data.linkedin}` : ''}
                      ${data.github ? ` | ${data.github}` : ''}
                  </div>
              </div>

              ${data.summary ? `
              <div class="section">
                  <div class="section-title">// Summary</div>
                  <div class="code-block">
                      <span style="color: #60a5fa;">const</span> summary = <span style="color: #fbbf24;">"${data.summary}"</span>;
                  </div>
              </div>
              ` : ''}

              ${data.skills && data.skills.length > 0 ? `
              <div class="section">
                  <div class="section-title">// Skills</div>
                  <div class="code-block">
                      <span style="color: #60a5fa;">const</span> skills = [<br>
                          ${data.skills.map(skill => `&nbsp;&nbsp;"${skill}"`).join(',<br>')}<br>
                      ];
                  </div>
              </div>
              ` : ''}

              ${data.experience && data.experience.length > 0 ? `
              <div class="section">
                  <div class="section-title">// Experience</div>
                  ${data.experience.map(exp => `
                  <div class="code-block">
                      <span style="color: #60a5fa;">class</span> ${exp.title ? exp.title.replace(/\s+/g, '') : 'Position'} {<br>
                          &nbsp;&nbsp;company: <span style="color: #fbbf24;">"${exp.company || 'Company'}"</span>,<br>
                          &nbsp;&nbsp;duration: <span style="color: #fbbf24;">"${exp.duration || 'Duration'}"</span>,<br>
                          &nbsp;&nbsp;description: <span style="color: #fbbf24;">"${exp.description || ''}"</span><br>
                      }
                  </div>
                  `).join('')}
              </div>
              ` : ''}

              ${data.projects && data.projects.length > 0 ? `
              <div class="section">
                  <div class="section-title">// Projects</div>
                  ${data.projects.map(project => `
                  <div class="code-block">
                      <span style="color: #60a5fa;">const</span> ${project.name ? project.name.replace(/\s+/g, '_').toLowerCase() : 'project'} = {<br>
                          &nbsp;&nbsp;name: <span style="color: #fbbf24;">"${project.name || 'Project'}"</span>,<br>
                          &nbsp;&nbsp;tech: [<span style="color: #10b981;">${project.technologies ? project.technologies.map(t => `"${t}"`).join(', ') : ''}</span>],<br>
                          &nbsp;&nbsp;description: <span style="color: #fbbf24;">"${project.description || ''}"</span><br>
                      };
                  </div>
                  `).join('')}
              </div>
              ` : ''}

              ${data.education && data.education.length > 0 ? `
              <div class="section">
                  <div class="section-title">// Education</div>
                  ${data.education.map(edu => `
                  <div class="code-block">
                      <span style="color: #60a5fa;">const</span> education = {<br>
                          &nbsp;&nbsp;degree: <span style="color: #fbbf24;">"${edu.degree || 'Degree'}"</span>,<br>
                          &nbsp;&nbsp;institution: <span style="color: #fbbf24;">"${edu.institution || 'Institution'}"</span>,<br>
                          &nbsp;&nbsp;year: <span style="color: #fbbf24;">"${edu.year || 'Year'}"</span><br>
                          ${edu.gpa ? `&nbsp;&nbsp;gpa: <span style="color: #10b981;">${edu.gpa}</span>,<br>` : ''}
                      };
                  </div>
                  `).join('')}
              </div>
              ` : ''}
          </div>
      </body>
      </html>
    `
  };

  return templates[templateType] || templates.professional;
}