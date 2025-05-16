class User < ApplicationRecord
  # Devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  belongs_to :role
  has_many :stays, foreign_key: 'guest_id'
  has_one :profile, dependent: :destroy
  has_one :accommodation, foreign_key: 'host_id'

  # Callbacks
  before_validation :set_default_role
  after_create :build_profile

  # Methods
  def set_default_role
    self.role ||= Role.find_by(name: 'guest')
  end

  def build_profile
    create_profile(karma_coins: 0, host_rating: 0, guest_rating: 0)
  end
end
