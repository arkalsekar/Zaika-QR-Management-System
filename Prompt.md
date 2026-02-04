I want to create a Zaika Food Coupon Mangement System for our college Fest known as Bonhomie 2026. 

I have a supabase account, with the table coupons and schema as the following  
create table public.coupons (
  coupon_id uuid not null default gen_random_uuid (),
  balance numeric not null,
  created_at timestamp with time zone not null default now(),
  used_at jsonb null default '[]'::jsonb,
  status text not null,
  counter_logs jsonb null default '[]'::jsonb,
  constraint coupons_pkey primary key (coupon_id),
  constraint coupons_status_check check (
    (
      status = any (
        array['active'::text, 'used'::text, 'expired'::text]
      )
    )
  )
) TABLESPACE pg_default;


Following is the credentials of the supabase account 
url = https://vskqcbkzggkrzahdnlre.supabase.co
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3FjYmt6Z2drcnphaGRubHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTgyOTksImV4cCI6MjA4MzQ3NDI5OX0.kJFRwcp0j5a4-KWLBDMnbDxaxBLHQ__K1d8aLiVao34

I want to have the following features in the system. 
1. There must be single login credential and that too for admin. 
2. Admin can manually create multiple login id's with details as counter_id, counter_name, counter_amount, counter_password, counter_email, counter_phone, counter_coordinator_name
3. Admin can create multiple coupons with details as coupon_balance, created_by which stored roll number and phone, email of the student. 
4. ONce a coupon is created, a qr code must be generated related to that coupon_id and should have button to send it to the email of the user 
5. The counter can login with counter_id and counter_password and can scan the qr code to use the coupon. 
6. The counter can use the coupon to buy food from the counter. 
7. Once a user comes to a counter, the counter can scan the qr code to use the coupon. 
8. Once the counter_coordinator scans the qr code, the coupon is first validated. if its valid than balance of the coupon and counter_amount is compared. if counter_amount is less than coupon_balance than the coupon is used and balance is reduced by counter_amount. if counter_amount is more than coupon_balance than the coupon is not used and balance is not reduced. if the coupon is used than the counter_logs is updated with the counter_id and counter_amount. if the coupon is not used than the used_at is updated with the counter_id and counter_amount. if the coupon is expired than the status is updated to expired. 
