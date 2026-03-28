import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
  const siteTitle = 'Advanced Task Tracker';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'Advanced Task Tracker - Manage your tasks with next-gen analytics, 3D visualizations, and efficient workflows.';
  const defaultKeywords = 'task tracker, productivity, task management, 3D dashboard, advanced analytics';

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={url || window.location.href} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Canonical Link */}
      <link rel="canonical" href={url || window.location.href} />
    </Helmet>
  );
};

export default SEO;
