export const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || 'https://panel.nicotatuaggi.com';
export const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_API_TOKEN || '';

/**
 * Normalizes incoming Directus CMS Media objects into a standard format.
 * Accounts for standard IDs, directus_files references, and nested mimes.
 * @param {Object|String} obj Raw Directus Media Payload
 * @returns {Object|null} Standardized { id, mime } object
 */
export const getAssetData = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return { id: obj, mime: null };
    if (obj.directus_files_id) return { id: obj.directus_files_id.id || obj.directus_files_id, mime: obj.directus_files_id.type };
    return { id: obj.id, mime: obj.type };
};

/**
 * Master utility to resolve image & video endpoints for frontend nodes.
 * Intelligently short-circuits absolute URLs (Unsplash/Pexels) ignoring internal CMS domains.
 * Applies progressive transformations directly to the CDN edge.
 * @param {Object|String} obj Extracted Asset Data
 * @param {String} params Image optimization queries (e.g., width=800&format=webp)
 * @returns {String|null} Fully-formed HTTP endpoint
 */
export const getAssetUrl = (obj, params = '') => {
    if (!obj) return null;
    if (typeof obj === 'string' && obj.startsWith('http')) return obj;
    if (obj.url) return obj.url;
    
    const data = getAssetData(obj);
    if (!data || !data.id) return null;
    if (typeof data.id === 'string' && data.id.startsWith('http')) return data.id;
    
    return `${DIRECTUS_URL}/assets/${data.id}${params ? '?' + params : ''}`;
};

/**
 * Asynchronous Data-fetching Engine resolving directly against the Directus JSON API.
 * Designed to drop SDK weight entirely.
 * Enforces boolean visibility mappings by default.
 * @param {String} endpoint The Core Directus Target Collection string match.
 * @param {String} query The optional URL filtering constraint matrix.
 * @returns {Promise<any|null>} Awaited Payload Node.
 */
export const fetchDirectus = async (endpoint, query = '?filter[visible][_eq]=true&fields=*.*') => {
  try {
    const res = await fetch(`${DIRECTUS_URL}/items/${endpoint}${query}`, {
      headers: DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.error(`Fetch exception for entity endpoint [${endpoint}]:`, e);
    return null;
  }
};
