-- Replace ALL placeholder emails, then run this in Supabase SQL Editor.
-- Do not commit the filled version with the family's real emails.
insert into public.memberships(email, role, display_name) values
  (lower('mentor@example.com'), 'mentor', 'Người hướng dẫn'),
  (lower('conan@example.com'), 'learner', 'Conan'),
  (lower('dad@example.com'), 'parent', 'Ba'),
  (lower('mom@example.com'), 'parent', 'Mẹ')
on conflict(email) do update set role=excluded.role, display_name=excluded.display_name;

-- To revoke a member later, run separately with the real email:
-- delete from public.memberships where email=lower('email-to-revoke@example.com');
