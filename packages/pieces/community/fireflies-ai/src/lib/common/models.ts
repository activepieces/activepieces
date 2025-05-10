export interface FirefliesMeetingAnalyticsCategories {
    questions?: number;
    date_times?: number;
    metrics?: number;
    tasks?: number;
}

export interface FirefliesSpeakerAnalytics {
    speaker_id?: string;
    name?: string;
    duration?: number;
    word_count?: number;
    longest_monologue?: number;
    monologues_count?: number;
    filler_words?: number;
    questions?: number;
    duration_pct?: number;
    words_per_minute?: number;
}

export interface FirefliesMeetingAnalytics {
    sentiments?: {
        negative_pct?: number;
        neutral_pct?: number;
        positive_pct?: number;
    };
    categories?: FirefliesMeetingAnalyticsCategories;
    speakers?: FirefliesSpeakerAnalytics[];
}

export interface FirefliesSpeakerInfo { // For the top-level speakers array
    id?: string;
    name?: string;
}

export interface FirefliesUserInfo {
    user_id?: string;
    email?: string;
    name?: string;
    num_transcripts?: number;
    recent_meeting?: string;
    minutes_consumed?: number;
    is_admin?: boolean;
    integrations?: string[];
}

export interface FirefliesMeetingAttendee {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    name?: string;
    location?: string;
}

export interface FirefliesSummary {
    keywords?: string[];
    action_items?: string[];
    outline?: string;
    shorthand_bullet?: string;
    overview?: string;
    bullet_gist?: string;
    gist?: string;
    short_summary?: string;
    short_overview?: string;
    meeting_type?: string;
    topics_discussed?: string;
    transcript_chapters?: string;
}

export interface FirefliesAIFilters {
    task?: boolean;
    pricing?: boolean;
    metric?: boolean;
    question?: boolean;
    date_and_time?: boolean;
    text_cleanup?: boolean;
    sentiment?: boolean;
}

export interface FirefliesSentence {
    index?: number;
    speaker_name?: string;
    speaker_id?: string;
    text?: string;
    raw_text?: string;
    start_time?: number;
    end_time?: number;
    ai_filters?: FirefliesAIFilters;
}

export interface FirefliesMeetingInfo {
    fred_joined?: boolean;
    silent_meeting?: boolean;
    summary_status?: string;
}

export interface FirefliesAppOutput {
    transcript_id?: string;
    user_id?: string;
    app_id?: string;
    created_at?: string;
    title?: string;
    prompt?: string;
    response?: string;
}

export interface FirefliesAppsPreview {
    outputs?: FirefliesAppOutput[];
}

export interface FirefliesTranscript {
    id: string;
    title?: string;
    host_email?: string;
    organizer_email?: string;
    user?: FirefliesUserInfo;
    speakers?: FirefliesSpeakerInfo[];
    transcript_url?: string;
    participants?: string[];
    meeting_attendees?: FirefliesMeetingAttendee[];
    fireflies_users?: string[];
    duration?: number;
    dateString?: string;
    date?: number;
    audio_url?: string;
    video_url?: string;
    sentences?: FirefliesSentence[];
    calendar_id?: string;
    summary?: FirefliesSummary;
    meeting_info?: FirefliesMeetingInfo;
    cal_id?: string;
    calendar_type?: string;
    apps_preview?: FirefliesAppsPreview;
    meeting_link?: string;
    analytics?: FirefliesMeetingAnalytics;
    privacy?: string;
}
