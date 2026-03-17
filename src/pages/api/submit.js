export const prerender = false;

export const POST = async ({ request }) => {
    try {
        const data = await request.json();
        const token = import.meta.env.SANITY_API_TOKEN;
        const projectId = 'ozqtzx80';

        const mutations = [{
            create: {
                _type: 'cityRequest',
                name: data.name,
                contact: data.contact,
                city: data.city
            }
        }];

        const url = `https://${projectId}.api.sanity.io/v2024-03-04/data/mutate/production`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ mutations })
        });

        const respuestaSanity = await res.json();

        if (res.ok) {
            return new Response(JSON.stringify({ message: "Éxito" }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
        }

    } catch (e) {
        return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
    }
}