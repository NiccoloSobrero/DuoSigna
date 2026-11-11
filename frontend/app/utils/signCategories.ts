export interface SignCategoryDefinition {
  id: string
  title: string
  icon: string
  description: string
  keys: string[]
}

export const SIGN_CATEGORY_DEFINITIONS: SignCategoryDefinition[] = [
  {
    id: 'animals',
    title: 'Animals',
    icon: 'i-lucide-paw-print',
    description: 'All terms related to animals and insects.',
    keys: ['alligator', 'animal', 'bee', 'bird', 'bug', 'cat', 'cow', 'dog', 'donkey', 'duck', 'elephant', 'fish', 'frog', 'giraffe', 'goose', 'hen', 'horse', 'kitty', 'lion', 'mouse', 'owl', 'pig', 'puppy', 'tiger', 'wolf', 'zebra']
  },
  {
    id: 'actions',
    title: 'Actions & Verbs',
    icon: 'i-lucide-activity',
    description: 'Physical actions, interactions, and movements.',
    keys: ['blow', 'can', 'clean', 'close', 'cry', 'cut', 'dance', 'drink', 'drop', 'dry', 'fall', 'find', 'finish', 'give', 'go', 'hate', 'have', 'haveto', 'hear', 'hide', 'jump', 'kiss', 'like', 'listen', 'look', 'make', 'nap', 'open', 'pretend', 'read', 'ride', 'say', 'see', 'shhh', 'sleep', 'smile', 'stay', 'talk', 'taste', 'think', 'touch', 'wait', 'wake']
  },
  {
    id: 'food',
    title: 'Food & Drinks',
    icon: 'i-lucide-utensils',
    description: 'Food items, snacks, and beverages.',
    keys: ['apple', 'carrot', 'cereal', 'chocolate', 'food', 'french-fries', 'gum', 'icecream', 'milk', 'nuts', 'orange', 'pizza', 'snack', 'water']
  },
  {
    id: 'home',
    title: 'Home & Rooms',
    icon: 'i-lucide-home',
    description: 'Rooms of the house, furniture, and household items.',
    keys: ['backyard', 'bath', 'bed', 'bedroom', 'chair', 'closet', 'drawer', 'dryer', 'garbage', 'glass-window', 'home', 'lamp', 'potty', 'refrigerator', 'room', 'shower', 'stairs', 'table', 'tv', 'vacuum']
  },
  {
    id: 'objects',
    title: 'Objects & Toys',
    icon: 'i-lucide-package',
    description: 'Everyday objects, toys, and small tools.',
    keys: ['balloon', 'book', 'doll', 'flag', 'gift', 'napkin', 'pen', 'pencil', 'penny', 'puzzle', 'radio', 'scissors', 'shoe', 'toothbrush', 'toy', 'zipper']
  },
  {
    id: 'transport',
    title: 'Transport',
    icon: 'i-lucide-car',
    description: 'Vehicles and modes of transportation.',
    keys: ['airplane', 'boat', 'car', 'helicopter']
  },
  {
    id: 'people_professions',
    title: 'Family, People & Professions',
    icon: 'i-lucide-users',
    description: 'Family members, professions, and general terms for people.',
    keys: ['aunt', 'boy', 'brother', 'child', 'clown', 'cowboy', 'dad', 'fireman', 'girl', 'grandma', 'grandpa', 'man', 'mom', 'person', 'police', 'uncle', 'yourself']
  },
  {
    id: 'body',
    title: 'Body Parts',
    icon: 'i-lucide-user',
    description: 'Anatomy and body parts.',
    keys: ['arm', 'cheek', 'chin', 'ear', 'eye', 'face', 'feet', 'hair', 'head', 'lips', 'mouth', 'nose', 'tongue', 'tooth']
  },
  {
    id: 'colors',
    title: 'Colors',
    icon: 'i-lucide-palette',
    description: 'Colors and shades.',
    keys: ['black', 'blue', 'brown', 'green', 'red', 'white', 'yellow']
  },
  {
    id: 'nature',
    title: 'Nature & Places',
    icon: 'i-lucide-tree-pine',
    description: 'Nature, weather, and physical spaces.',
    keys: ['cloud', 'farm', 'flower', 'grass', 'moon', 'outside', 'pool', 'rain', 'snow', 'store', 'sun', 'there', 'tree']
  },
  {
    id: 'clothing',
    title: 'Clothing',
    icon: 'i-lucide-shirt',
    description: 'Apparel and accessories.',
    keys: ['hat', 'jacket', 'jeans', 'mitten', 'pajamas', 'shirt', 'underwear']
  },
  {
    id: 'emotions',
    title: 'Emotions, States & Adjectives',
    icon: 'i-lucide-smile',
    description: 'Feelings, conditions, and descriptive attributes.',
    keys: ['awake', 'bad', 'better', 'cute', 'dirty', 'empty', 'fast', 'fine', 'first', 'happy', 'high', 'hot', 'hungry', 'loud', 'mad', 'noisy', 'old', 'owie', 'pretty', 'quiet', 'sad', 'same', 'sick', 'sleepy', 'sticky', 'stuck', 'thirsty', 'wet', 'yucky']
  },
  {
    id: 'greetings',
    title: 'Greetings & Manners',
    icon: 'i-lucide-message-circle-heart',
    description: 'Polite expressions, greetings, and basic communication.',
    keys: ['bye', 'hello', 'please', 'thank-you']
  },
  {
    id: 'other',
    title: 'Time, Questions, Adverbs & Other',
    icon: 'i-lucide-help-circle',
    description: 'Time concepts, pronouns, adverbs, and grammar words.',
    keys: ['after', 'all', 'another', 'any', 'because', 'before', 'beside', 'down', 'every', 'for', 'he', 'if', 'into', 'later', 'many', 'minemy', 'morning', 'music', 'night', 'no', 'not', 'now', 'on', 'story', 'that', 'time', 'tomorrow', 'up', 'we', 'where', 'who', 'why', 'will', 'yes', 'yesterday']
  }
]

const SIGN_TO_CATEGORY_MAP = new Map<string, string>(
  SIGN_CATEGORY_DEFINITIONS.flatMap(category =>
    category.keys.map(key => [key.toLowerCase(), category.id] as const)
  )
)

export const getSignCategory = (signName: string, isLetter = false): string => {
  const normalized = (signName || '').trim().toLowerCase()
  if (!normalized) {
    return 'uncategorized'
  }
  if (isLetter || /^[a-z]$/.test(normalized)) {
    return 'alphabet'
  }
  return SIGN_TO_CATEGORY_MAP.get(normalized) || 'uncategorized'
}
