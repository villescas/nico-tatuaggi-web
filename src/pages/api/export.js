export const prerender = false;

export const GET = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const cityFilter = url.searchParams.get('city');

        const projectId = 'ozqtzx80';

        // Build query based on whether a specific city was requested
        let queryStr = '*[_type == "cityRequest"] { name, contact, city, _createdAt } | order(_createdAt desc)';
        if (cityFilter) {
            queryStr = `*[_type == "cityRequest" && city == "${cityFilter.replace(/"/g, '\\"')}"] { name, contact, city, _createdAt } | order(_createdAt desc)`;
        }

        const query = encodeURIComponent(queryStr);
        const sanityUrl = `https://${projectId}.api.sanity.io/v2024-03-04/data/query/production?query=${query}`;

        const res = await fetch(sanityUrl);
        const data = await res.json();
        const requests = data.result || [];

        // Generate CSV Data
        const csvRows = ['Name,Email,City,Date'];
        requests.forEach(req => {
            const name = `"${(req.name || '').replace(/"/g, '""')}"`;
            const contact = `"${(req.contact || '').replace(/"/g, '""')}"`;
            const city = `"${(req.city || '').replace(/"/g, '""')}"`;
            const date = `"${new Date(req._createdAt).toLocaleDateString()}"`;
            csvRows.push(`${name},${contact},${city},${date}`);
        });

        const csvString = csvRows.join('\n');

        return new Response(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                // Tell browser to download it
                'Content-Disposition': `attachment; filename="pedidos-tinta.csv"`
            }
        });

    } catch (e) {
        console.error("CSV Export Error:", e);
        return new Response('Error generating CSV', { status: 500 });
    }
}
