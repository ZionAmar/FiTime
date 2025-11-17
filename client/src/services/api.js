const BASE_URL = '';
// const BASE_URL = 'http://localhost:4060';

let STUDIO_ID = localStorage.getItem('activeStudioId') || null;

const setStudioId = (studioId) => {
    STUDIO_ID = studioId;
    if (studioId) {
        localStorage.setItem('activeStudioId', studioId);
    } else {
        localStorage.removeItem('activeStudioId');
    }
};

const customFetch = async (url, options = {}) => {
    const fullUrl = `${BASE_URL}${url}`;

    const headers = options.headers || new Headers();
    if (STUDIO_ID) {
        headers.set('x-studio-id', STUDIO_ID);
    }

    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const updatedOptions = { ...options, headers, credentials: 'include' };

    const response = await fetch(fullUrl, updatedOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Server error: ${response.statusText}` }));
        
        const error = new Error(errorData.message || 'An API error occurred');
        error.response = {
            data: errorData,
            status: response.status
        };
        
        throw error; 
    }
    
    if (response.status === 204) return null; 
    return response.json();
};

const createBodyRequest = (method) => (url, body, options) => {
    const fetchOptions = { ...options, method };
    
    if (body instanceof FormData) {
        fetchOptions.body = body;
    } else if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
    }
    
    return customFetch(url, fetchOptions);
};


export default {
    setStudioId,
    get: (url, options) => customFetch(url, { ...options, method: 'GET' }),
    post: createBodyRequest('POST'),
    put: createBodyRequest('PUT'),
    patch: createBodyRequest('PATCH'),
    delete: (url, options) => customFetch(url, { ...options, method: 'DELETE' }),
};