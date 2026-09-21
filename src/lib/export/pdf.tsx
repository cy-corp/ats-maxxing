import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { OptimizedResume, ResumeDensity } from "../types";
import { cleanEmptyDecorators } from "../preserve-source";

function createStyles(density: ResumeDensity) {
  const condensed = density === "condensed";
  return StyleSheet.create({
    page: {
      paddingTop: condensed ? 28 : 40,
      paddingBottom: condensed ? 28 : 40,
      paddingHorizontal: condensed ? 36 : 48,
      fontSize: condensed ? 9.5 : 10,
      fontFamily: "Helvetica",
      color: "#111111",
      lineHeight: condensed ? 1.28 : 1.4,
    },
    name: {
      fontSize: condensed ? 14 : 16,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      marginBottom: condensed ? 2 : 4,
    },
    contact: {
      fontSize: condensed ? 8.5 : 9,
      textAlign: "center",
      marginBottom: condensed ? 8 : 16,
      color: "#333333",
    },
    section: {
      marginTop: condensed ? 7 : 12,
      marginBottom: condensed ? 2 : 4,
    },
    sectionTitle: {
      fontSize: condensed ? 10 : 11,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      borderBottomWidth: 1,
      borderBottomColor: "#222222",
      paddingBottom: condensed ? 1 : 2,
      marginBottom: condensed ? 4 : 6,
    },
    body: {
      fontSize: condensed ? 9.5 : 10,
    },
    jobTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: condensed ? 9.5 : 10,
      marginTop: condensed ? 4 : 6,
    },
    meta: {
      fontSize: condensed ? 8.5 : 9,
      fontStyle: "italic",
      marginBottom: condensed ? 1 : 2,
      color: "#333333",
    },
    bullet: {
      flexDirection: "row",
      marginBottom: condensed ? 1 : 2,
      paddingLeft: condensed ? 2 : 4,
    },
    bulletDot: {
      width: condensed ? 8 : 10,
      fontSize: condensed ? 9 : 10,
    },
    bulletText: {
      flex: 1,
      fontSize: condensed ? 9.5 : 10,
    },
  });
}

function ResumePdfDocument({
  resume,
  density,
}: {
  resume: OptimizedResume;
  density: ResumeDensity;
}) {
  const styles = createStyles(density);
  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.portfolio,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.name}>{resume.contact.name}</Text>
        <Text style={styles.contact}>{contactLine}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.body}>{resume.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {resume.experience.map((exp, i) => (
            <View key={`${exp.company}-${i}`} wrap={false}>
              <Text style={styles.jobTitle}>
                {exp.title} — {exp.company}
              </Text>
              <Text style={styles.meta}>
                {exp.startDate} – {exp.endDate}
                {exp.location ? ` | ${exp.location}` : ""}
              </Text>
              {exp.bullets.map((b, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resume.education.map((edu, i) => (
            <View key={`${edu.school}-${i}`}>
              <Text style={styles.body}>
                {edu.year?.trim()
                  ? `${edu.degree} — ${edu.school} (${edu.year.trim()})`
                  : `${edu.degree} — ${edu.school}`}
              </Text>
              {edu.details ? (
                <Text style={styles.meta}>{edu.details}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Skills</Text>
          <Text style={styles.body}>{resume.skills.join(", ")}</Text>
        </View>

        {resume.projects?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((p, i) => (
              <Text key={i} style={styles.body}>
                {p.name}
                {p.tech?.trim() ? ` (${p.tech.trim()})` : ""}: {p.description}
              </Text>
            ))}
          </View>
        ) : null}

        {resume.certifications?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((cert, i) => {
              const cleaned = cleanEmptyDecorators(cert);
              if (!cleaned) return null;
              return (
                <View key={i} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{cleaned}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export async function buildPdfBuffer(resume: OptimizedResume): Promise<Buffer> {
  const density: ResumeDensity =
    resume.density === "extended" ? "extended" : "condensed";
  const instance = pdf(
    <ResumePdfDocument resume={resume} density={density} />,
  );
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
