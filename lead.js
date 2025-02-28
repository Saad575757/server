async function convertLead(leadId, accessToken, instanceUrl, stageName) {
    const apiUrl = `${instanceUrl}/services/data/v63.0/sobjects/Lead/${leadId}/convert`; // Replace v59.0 if needed

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                convertedStatus: stageName, // Or another valid status
                // Add optional fields as needed
            }),
        });

        const data = await response.json();
        console.log("Lead conversion response:", data);

        if (!response.ok) {
            console.error("Lead conversion failed:", data);
        }
        return data;
    } catch (error) {
        console.error("Error converting lead:", error);
        return null;
    }
}

// Example usage:
const leadId = '00QAu00000OcY4VMAV';
const accessToken = '00DAu0000034x1N!AQEAQMKz3obN.Fb2bCavtqwTVx_gPPB6dWJ1aoGHxEzq.vsjvZjh6eMvLT3ELYpeV0sCzGvyZWLAOWNEUdUHScOmKReh_BpS';
const instanceUrl = 'https://erptechnicals--fulrdpbx.sandbox.my.salesforce.com';

const stageName = "Qualification"; // Or the name of your stage
convertLead(leadId, accessToken, instanceUrl, stageName);