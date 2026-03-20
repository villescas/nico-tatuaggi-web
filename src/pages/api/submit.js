export const prerender = false;

export const POST = async ({ request }) => {
    try {
        const data = await request.json();
        const token = import.meta.env.DIRECTUS_API_TOKEN;
        const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

        const payload = {
            name: data.name,
            contact: data.contact,
            city: data.city
        };

        const url = `${directusUrl}/items/cityRequest`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            return new Response(JSON.stringify({ message: "Éxito" }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
        }

    } catch (e) {
        return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
    }
}