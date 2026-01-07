"use server";

import { z } from "zod";
import { aiMotionDetectionAlert } from "@/ai/flows/ai-motion-detection-alert";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function analyzeImage(imageDataUri: string) {
    try {
        if (!imageDataUri) {
            throw new Error("Image data is required");
        }

        const result = await aiMotionDetectionAlert({
            cameraFeed: imageDataUri,
        });

        return result;

    } catch (error) {
        console.error("AI analysis error:", error);
        // Ensure a consistent return shape on error
        return { alertMessage: 'Failed to analyze the image due to a server error.' };
    }
}

export async function revalidateServices() {
    revalidatePath('/dashboard/services');
    revalidatePath('/');
}

export async function revalidateProducts() {
    revalidatePath('/dashboard/products');
    revalidatePath('/');
}

export async function revalidatePricing() {
    revalidatePath('/dashboard/pricing');
    revalidatePath('/');
}

// Helper for admin client - ONLY defines the potential to be admin
const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );
}

// Helper: Ensure the current user is an admin
async function requireAdmin() {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Unauthorized: Not logged in");
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        throw new Error("Forbidden: Admin access required");
    }

    return user;
}

export async function setAdminRole(uid: string, isAdminRole: boolean) {
    try {
        // SECURITY CHECK
        await requireAdmin();

        const supabase = getSupabaseAdmin();
        const role = isAdminRole ? 'admin' : 'user';

        // Update profiles table
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', uid);

        if (error) throw error;

        // Note: Supabase doesn't use custom claims for this logic in our implementation,
        // we rely on the public.profiles table.

        return { success: true, madeAdmin: isAdminRole };
    } catch (error: any) {
        console.error("Failed to set admin role:", error);
        return { success: false, error: error.message };
    }
}

export async function updateUserRole(uid: string, newRole: 'admin' | 'user') {
    try {
        // SECURITY CHECK
        await requireAdmin();

        const supabase = getSupabaseAdmin();

        // Server-side check to prevent removing the last admin
        if (newRole === 'user') {
            const { data: requestorProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', uid)
                .single();

            // Check how many admins exist
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin');

            if (count !== null && count <= 1 && requestorProfile?.role === 'admin') {
                // If there is only 1 admin and we are demoting them (presumably the target user is an admin)
                // Actually logic check: we are updating `uid`. Is `uid` the last admin?
                // We should check if `uid` IS an admin currently.
                const { data: targetProfile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', uid)
                    .single();

                if (targetProfile?.role === 'admin' && count <= 1) {
                    throw new Error("Cannot remove the last admin.");
                }
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', uid);

        if (error) throw error;

        // Revalidate the path to ensure the UI updates everywhere
        revalidatePath(`/dashboard/users`);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update user role:", error);
        return { success: false, error: error.message };
    }
}
