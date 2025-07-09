import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoProfile {
    id: string;
    attributes: {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
}

interface KlaviyoList {
    id: string,
    attributes: {
        name?: string;
    };
}

export const profileIdDropdown = Property.Dropdown({
    displayName: 'Profile Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const profiles = await makeRequest(auth as string, HttpMethod.GET, '/', {});

        // loop through data and map to options
        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
            const firstName = field.attributes.first_name || '';
            const lastName = field.attributes.last_name || '';
            const label = [firstName, lastName].filter(Boolean).join(' ');
            return {
                label: label || field.id,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
})

export const profileIdsMultiSelectDropdown = Property.MultiSelectDropdown({
    displayName: 'Profile Ids',
    description: 'Select one or more Klaviyo profiles',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        // Fetch profiles from the correct endpoint
        const profiles = await makeRequest(auth as string, HttpMethod.GET, '/profiles', {});

        // Map profiles to dropdown options with better labels and types
        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
            const firstName = field.attributes.first_name || '';
            const lastName = field.attributes.last_name || '';
            const email = field.attributes.email || '';
            const label = [firstName, lastName].filter(Boolean).join(' ') + (email ? ` (${email})` : '');
            return {
                label: label || field.id,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
});

export const listIdDropdown = Property.Dropdown({
    displayName: 'List Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const list = await makeRequest(auth as string, HttpMethod.GET, '/lists', {});

        // loop through data and map to options
        const options = (list.data as KlaviyoList[]).map((field) => {
            const name = field.attributes.name || '';
            return {
                label: name || field.id,
                value: field.id,
            };
        });

        return {
            options,
        };
    },
})

export const countryDropdown = Property.StaticDropdown({
    displayName: 'Preferred Country',
    description:
        "The country to use for the search. It's a two-letter country code.",
    required: false,
    defaultValue: 'Default',
    options: {
        options: [
            { label: 'Default', value: 'Default' },
            { label: 'United States', value: 'US' },
            { label: 'Canada', value: 'CA' },
            { label: 'Mexico', value: 'MX' },
            { label: 'United Kingdom', value: 'GB' },
            { label: 'Germany', value: 'DE' },
            { label: 'France', value: 'FR' },
            { label: 'Japan', value: 'JP' },
            { label: 'China', value: 'CN' },
            { label: 'India', value: 'IN' },
            { label: 'Brazil', value: 'BR' },
            { label: 'Australia', value: 'AU' },
            { label: 'Italy', value: 'IT' },
            { label: 'Spain', value: 'ES' },
            { label: 'South Korea', value: 'KR' },
            { label: 'Netherlands', value: 'NL' },
            { label: 'Switzerland', value: 'CH' },
            { label: 'Sweden', value: 'SE' },
            { label: 'Ireland', value: 'IE' },
            { label: 'Singapore', value: 'SG' },
            { label: 'Israel', value: 'IL' },
            { label: 'Saudi Arabia', value: 'SA' },
            { label: 'South Africa', value: 'ZA' },
            { label: 'United Arab Emirates', value: 'AE' },
        ],
    },
});


export const countryCodeDropdown = Property.StaticDropdown({
    displayName: 'Country Calling Code',
    description: "Select the country calling code (e.g., +91 for India).",
    required: false,
    defaultValue: '+1',
    options: {
        options: [
            { label: 'United States (+1)', value: '+1' },
            { label: 'Canada (+1)', value: '+1' },
            { label: 'India (+91)', value: '+91' },
            { label: 'United Kingdom (+44)', value: '+44' },
            { label: 'Australia (+61)', value: '+61' },
            { label: 'Germany (+49)', value: '+49' },
            { label: 'France (+33)', value: '+33' },
            { label: 'Japan (+81)', value: '+81' },
            { label: 'China (+86)', value: '+86' },
            { label: 'Brazil (+55)', value: '+55' },
            { label: 'Mexico (+52)', value: '+52' },
            { label: 'South Africa (+27)', value: '+27' },
            { label: 'United Arab Emirates (+971)', value: '+971' },
            { label: 'Italy (+39)', value: '+39' },
            { label: 'Spain (+34)', value: '+34' },
            { label: 'Russia (+7)', value: '+7' },
            { label: 'Netherlands (+31)', value: '+31' },
            { label: 'Switzerland (+41)', value: '+41' },
            { label: 'Sweden (+46)', value: '+46' },
            { label: 'Ireland (+353)', value: '+353' },
            { label: 'Singapore (+65)', value: '+65' },
            { label: 'Israel (+972)', value: '+972' },
            { label: 'Saudi Arabia (+966)', value: '+966' },
            { label: 'Turkey (+90)', value: '+90' },
            { label: 'New Zealand (+64)', value: '+64' },
            { label: 'Pakistan (+92)', value: '+92' },
            { label: 'Bangladesh (+880)', value: '+880' },
            { label: 'Indonesia (+62)', value: '+62' },
            { label: 'Philippines (+63)', value: '+63' },
            { label: 'Malaysia (+60)', value: '+60' },
            { label: 'South Korea (+82)', value: '+82' },
            { label: 'Thailand (+66)', value: '+66' },
            { label: 'Vietnam (+84)', value: '+84' },
            { label: 'Egypt (+20)', value: '+20' },
            { label: 'Nigeria (+234)', value: '+234' },
            { label: 'Kenya (+254)', value: '+254' },
            { label: 'Argentina (+54)', value: '+54' },
            { label: 'Chile (+56)', value: '+56' },
            { label: 'Colombia (+57)', value: '+57' },
            { label: 'Venezuela (+58)', value: '+58' },
            { label: 'Poland (+48)', value: '+48' },
            { label: 'Greece (+30)', value: '+30' },
            { label: 'Portugal (+351)', value: '+351' },
            { label: 'Belgium (+32)', value: '+32' },
            { label: 'Austria (+43)', value: '+43' },
            { label: 'Denmark (+45)', value: '+45' },
            { label: 'Finland (+358)', value: '+358' },
            { label: 'Norway (+47)', value: '+47' },
            { label: 'Czech Republic (+420)', value: '+420' },
            { label: 'Hungary (+36)', value: '+36' },
            { label: 'Romania (+40)', value: '+40' },
            { label: 'Ukraine (+380)', value: '+380' },
            { label: 'Slovakia (+421)', value: '+421' },
            { label: 'Slovenia (+386)', value: '+386' },
            { label: 'Croatia (+385)', value: '+385' },
            { label: 'Bulgaria (+359)', value: '+359' },
            { label: 'Estonia (+372)', value: '+372' },
            { label: 'Lithuania (+370)', value: '+370' },
            { label: 'Latvia (+371)', value: '+371' },
            { label: 'Luxembourg (+352)', value: '+352' },
            { label: 'Iceland (+354)', value: '+354' },
            { label: 'Hong Kong (+852)', value: '+852' },
            { label: 'Taiwan (+886)', value: '+886' },
            { label: 'Morocco (+212)', value: '+212' },
            { label: 'Algeria (+213)', value: '+213' },
            { label: 'Tunisia (+216)', value: '+216' },
            { label: 'Ghana (+233)', value: '+233' },
            { label: 'Tanzania (+255)', value: '+255' },
            { label: 'Ethiopia (+251)', value: '+251' },
            { label: 'Uganda (+256)', value: '+256' },
            { label: 'Zimbabwe (+263)', value: '+263' },
            { label: 'Qatar (+974)', value: '+974' },
            { label: 'Kuwait (+965)', value: '+965' },
            { label: 'Bahrain (+973)', value: '+973' },
            { label: 'Oman (+968)', value: '+968' },
            { label: 'Jordan (+962)', value: '+962' },
            { label: 'Lebanon (+961)', value: '+961' },
            { label: 'Cyprus (+357)', value: '+357' },
            { label: 'Malta (+356)', value: '+356' },
            { label: 'Georgia (+995)', value: '+995' },
            { label: 'Armenia (+374)', value: '+374' },
            { label: 'Azerbaijan (+994)', value: '+994' },
            { label: 'Kazakhstan (+7)', value: '+7' },
            { label: 'Uzbekistan (+998)', value: '+998' },
            { label: 'Mongolia (+976)', value: '+976' },
            { label: 'Nepal (+977)', value: '+977' },
            { label: 'Sri Lanka (+94)', value: '+94' },
            { label: 'Afghanistan (+93)', value: '+93' },
            { label: 'Iraq (+964)', value: '+964' },
            { label: 'Iran (+98)', value: '+98' },
            { label: 'Syria (+963)', value: '+963' },
            { label: 'Yemen (+967)', value: '+967' },
            { label: 'Sudan (+249)', value: '+249' },
            { label: 'Libya (+218)', value: '+218' },
            { label: 'Senegal (+221)', value: '+221' },
            { label: 'Cameroon (+237)', value: '+237' },
            { label: 'Ivory Coast (+225)', value: '+225' },
            { label: 'Angola (+244)', value: '+244' },
            { label: 'Mozambique (+258)', value: '+258' },
            // Add more as needed
        ],
    },
});