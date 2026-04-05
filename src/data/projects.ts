import projectsIndex from "@/data/projects.json";
import aerospecDetail from "@/data/project-details/aerospec.json";
import ionosphereDetectionDetail from "@/data/project-details/ionosphere-detection.json";
import pnwBtacDetail from "@/data/project-details/pnw-btac.json";
import airLeaksDetail from "@/data/project-details/air-leaks.json";
import wegoDetail from "@/data/project-details/wego.json";
import ecosDetail from "@/data/project-details/ecos.json";
import fruitRipenessDetail from "@/data/project-details/fruit-ripeness.json";
import ammoniaDetail from "@/data/project-details/ammonia.json";

export type ProjectIndexEntry = (typeof projectsIndex)[number];

export type ProjectDetailImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ProjectDetailContent = {
  overview: string[];
  longTermGoals?: string[];
  skills?: string[];
  quickPoints?: string[];
  images?: ProjectDetailImage[];
};

export type ProjectDetail = ProjectIndexEntry & ProjectDetailContent;

const internalProjectModules: Record<string, ProjectDetail> = {
  aerospec: {
    ...projectsIndex.find((project) => project.slug === "aerospec")!,
    ...aerospecDetail,
  },
  
  "ionosphere-detection": {
  ...projectsIndex.find((project) => project.slug === "ionosphere-detection")!,
  ...ionosphereDetectionDetail,
  },

  "pnw-btac": {
  ...projectsIndex.find((project) => project.slug === "pnw-btac")!,
  ...pnwBtacDetail,
  },

  "air-leaks": {
  ...projectsIndex.find((project) => project.slug === "air-leaks")!,
  ...airLeaksDetail,
  },
 
  "wego": {
  ...projectsIndex.find((project) => project.slug === "wego")!,
  ...wegoDetail,
  },

  "ecos": {
  ...projectsIndex.find((project) => project.slug === "ecos")!,
  ...ecosDetail,
  },

  "fruit-ripeness": {
  ...projectsIndex.find((project) => project.slug === "fruit-ripeness")!,
  ...fruitRipenessDetail,
  },

  "ammonia": {
  ...projectsIndex.find((project) => project.slug === "ammonia")!,
  ...ammoniaDetail,
  },
};

export function getProjects() {
  return projectsIndex;
}

export function getInternalProjectSlugs() {
  return Object.keys(internalProjectModules);
}

export function getProjectBySlug(slug: string) {
  return internalProjectModules[slug] ?? null;
}