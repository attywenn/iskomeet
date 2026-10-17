-- Create user_looking_for_genders table for many-to-many relationship between users and genders
CREATE TABLE IF NOT EXISTS public.user_looking_for_genders (
    user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    gender_id integer NOT NULL REFERENCES public.gender(gender_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, gender_id)
);

-- Backfill from users_other_info if looking_for_gender_id exists
INSERT INTO public.user_looking_for_genders (user_id, gender_id)
SELECT user_id, looking_for_gender_id 
FROM public.users_other_info 
WHERE looking_for_gender_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.user_looking_for_genders ENABLE ROW LEVEL SECURITY;
