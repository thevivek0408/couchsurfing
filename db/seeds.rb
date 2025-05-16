puts 'Seeding...'

# Delete dependent records first
Message.destroy_all
Review.destroy_all
Stay.destroy_all
Accommodation.destroy_all
Profile.destroy_all
User.destroy_all
puts 'Users, profiles, accommodations, stays, reviews, and messages deleted'

# Now it's safe to delete roles
Role.destroy_all
puts 'Roles deleted'

# Recreate roles
roles = %w[admin host guest]
roles.each { |role| Role.create!(name: role) }
puts 'Roles created'

# Accommodation types
AccommodationType.destroy_all
puts 'Accommodation types deleted'

types = ['House', 'Apartment', 'Condo', 'Townhouse', 'Bed & Breakfast', 'Boutique Hotel', 'Guest Suite']
types.each { |type| AccommodationType.create!(name: type, description: "#{type} description", cost: 100.0) }
puts 'Accommodation types created'

# Create Admin User
admin = User.create!(
  email: 'admin@example.com',
  password: '123456',
  role: Role.find_by(name: 'admin')
)
admin.create_profile(first_name: 'Admin', last_name: 'User', karma_coins: 0, host_rating: 0, guest_rating: 0)
puts 'Admin user created'

# Create Hosts
host1 = User.create!(
  email: 'host1@example.com',
  password: '123456',
  role: Role.find_by(name: 'host')
)
host1.create_profile(first_name: 'Host', last_name: 'One', karma_coins: 0, host_rating: 0, guest_rating: 0)

host2 = User.create!(
  email: 'host2@example.com',
  password: '123456',
  role: Role.find_by(name: 'host')
)
host2.create_profile(first_name: 'Host', last_name: 'Two', karma_coins: 0, host_rating: 0, guest_rating: 0)

puts 'Hosts created'

# Create Guests
guest1 = User.create!(
  email: 'guest1@example.com',
  password: '123456',
  role: Role.find_by(name: 'guest')
)
guest1.create_profile(first_name: 'Guest', last_name: 'One', karma_coins: 0, host_rating: 0, guest_rating: 0)

guest2 = User.create!(
  email: 'guest2@example.com',
  password: '123456',
  role: Role.find_by(name: 'guest')
)
guest2.create_profile(first_name: 'Guest', last_name: 'Two', karma_coins: 0, host_rating: 0, guest_rating: 0)

puts 'Guests created'

# Create Accommodations
accommodation1 = Accommodation.create!(
  name: 'Host1 House',
  description: 'A lovely house with modern amenities.',
  address: '456 Host Lane',
  accommodation_type: AccommodationType.find_by(name: 'House'),
  host_id: host1.id,
  available_start_date: Date.today,
  available_end_date: Date.today + 30,
  latitude: 0.0,
  longitude: 0.0,
  date_created: Date.today,
  city: 'Test City',
  country: 'Testland'
)

accommodation2 = Accommodation.create!(
  name: 'Host2 Apartment',
  description: 'Cozy apartment in the city center.',
  address: '789 Host Blvd',
  accommodation_type: AccommodationType.find_by(name: 'Apartment'),
  host_id: host2.id,
  available_start_date: Date.today,
  available_end_date: Date.today + 30,
  latitude: 0.0,
  longitude: 0.0,
  date_created: Date.today,
  city: 'Test City',
  country: 'Testland'
)

puts 'Accommodations created'

# Create stays
stay1 = Stay.create!(
  guest_id: guest1.id,
  accommodation_id: accommodation1.id,
  start_date: Date.today + 10.days,
  end_date: Date.today + 15.days,
  confirmed: true
)

stay2 = Stay.create!(
  guest_id: guest2.id,
  accommodation_id: accommodation2.id,
  start_date: Date.today + 20.days,
  end_date: Date.today + 25.days,
  confirmed: true
)

puts 'Stays created'

# Create reviews
# Accommodation reviews (you may need to adapt to your Review model)
Review.create!(
  user_id: guest1.id,
  accommodation_id: accommodation1.id,
  rating: 5,
  comment: 'The house was clean and had everything I needed.'
)

Review.create!(
  user_id: guest2.id,
  accommodation_id: accommodation2.id,
  rating: 4,
  comment: 'Great location and nice amenities.'
)

puts 'Reviews created'

# Create messages (adjust if your message model is different)
Message.create!(
  stay_id: stay1.id,
  user_id: guest1.id,
  content: 'Hi Host1, I am looking forward to my stay!'
)

Message.create!(
  stay_id: stay1.id,
  user_id: host1.id,
  content: 'Thanks! Let me know if you need anything.'
)

Message.create!(
  stay_id: stay2.id,
  user_id: guest2.id,
  content: 'Hello Host2, can you provide early check-in?'
)

Message.create!(
  stay_id: stay2.id,
  user_id: host2.id,
  content: 'I will check availability and let you know.'
)

puts 'Messages created'
puts 'Seeding complete!'
