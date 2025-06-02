## Purpose & Target Audience
### Primary Objective: Assist one user (for instance, a Bengali‐speaking user) in constructing customized vocabulary lists and quizzing themselves on English ↔ German word pairs.

### For: Self-directed learners who wish to acquire and expand their German vocabulary using their own topics (categories) and typing out word-pairs themselves.

## Core Concepts

### Categories
These are all themed word lists (i.e., “Fruits,” “Verbs,” “Everyday Phrases”).
Users can create, rename, or remove categories.

### Word Pairs
In every category, the user inserts an English word and the corresponding German word.
Words get saved locally (through AsyncStorage), which keeps them available across app restarts.

### Quiz
All the words across all the categories are grouped into one pool.
The vocabulary is shuffled and each word appears once in English, together with four German-language alternatives (a single correct one and three distractors).
As soon as the user responds, the following word is revealed.
After all the words have been quizzed, an “All Done" option requests to begin again using a freshly shuffled pool.

## Main Screens & Navigation

### Categories Screen (Home Tab)

Provides a scrollable list containing all category names and their corresponding word count.

A “+” icon in the top heading allows the user to add a new category anytime.

Tapping a category row:

Sets which make that category "active" (for reference, if you wished to store a choice).

Navigates to the Word List for said category.

A tiny trash (or rename) icon beside every category permits deletion (or renaming) through a confirmation dialog.

### Add Category Screen

Basic form consisting of one text input (Category Name) and one "Create Category" button.

Validates not-empty name, inserts it into AsyncStorage, and returns to Categories.

### Word List Screen

Displays all the words belonging to the tapped category (English → German).

Every row shows the English word on the top and the corresponding German word below it, along with an icon to remove that word.

A bottom right floating " +” icon opens Add Word.

### Add Word Screen

Two text input fields (“English Word” and “German Equivalent”) and a "Save Word" button.

Validates both the fields and then stores the new word pair into the chosen category’s words[] array.

On success, it returns to Word List, indicating the new entry added.

On storage failure or storage error, it shows an inline error in red.

### Quiz Screen (Quiz Tab)

Flattens all the word pairs in every category into one array.

During first load (when there is at least one word), the application randomly shuffles that array of indices and automatically selects the first word.

It shows:

A prompt “Translate the word:”

The English word in large text

Four German options (one correct, three other random German translations)

Upon tapping on an option:

If correct, there is an alert stating “Correct!” and having a “Next” button, which invokes pickNextWord() to present the next

If incorrect, there is an alert which says “Try again” and the word stays on the screen

After having displayed each word once (pool is exhausted), it places a finished flag and displays an “All Done – Start again?” notice.

If the user selects Yes, there is a new shuffled pool created and the quiz is reset.

If No, the screen stays on a "Preparing quiz..." placeholder until manually navigated away from or restarted.


## Data Flow & Persistence

### AsyncStorage Key:
All the categories (and their terms) are stored under one key (for example, @my_translate_quiz_app_categories).

### On App Launch

Context provider is reading that key.

If it is empty or missing, it establishes a default category { name: 'Default', words: [] }.

Otherwise, it processes the stored JSON into an array:

json
Copy
Edit
[
  { name: 'Default', words: [{ original: 'Hi', de: 'Hallo' }] },
  { name: 'Noun', words: [{ original: 'Apple', de: 'Apfel' }] }
]
### Adding/Removing Categories or Terms

Whenever you add/remove any category or word, the code:

Updates the in-memory array (setCategories(...))

Persists the new array to AsyncStorage through AsyncStorage.setItem(...)

This guarantees that data is kept current and refreshed on the next execution.

## Major Technical Facts

### React Context (AppContext)

Keeps the array of categories, along with helper functions:

addCategory(name)

updateCategoryName(index, newName)

deleteCategory(index)

addManualWordToCategory(english, german, categoryIndex)

deleteWord(wordIndex, categoryIndex)

Exposes these functions and state to any screen using useContext(AppContext).

### State Flags for Quiz Logic

pool: an integer array of indices (0…N−1) corresponding to positions across allWords. It is shuffled once.

initialized: ensures the pool is only initialized the first time words exist, not on every render.

currentIdx: index of the current word being displayed

finished: turns true when pool is empty

hasAlerted: ensures “All Done” alert appears only once per cycle

### React Hooks Pattern

useEffect([allWords.length, initialized]): builds the pool once and picks the first word

pickNextWord(): called after each correct answer

useFocusEffect(...): triggers “All Done” only when quiz screen is in focus

### UI Components

Category & Word List Screens: FlatList, TouchableOpacity, and Ionicons

Add Screens: TextInput + Button, with validation

Quiz Screen: centered layout with feedback alerts

## General User Flow

### First Launch

App starts with a default empty category

Categories tab shows “Default (0 words)”

### Creating a New Category

Tap “+” → Add Category screen → type “Noun” → Create

Return to view “Default (0)” and “Noun (0)”

### Adding Words

Tap “Noun” → Word List → tap “+” → type “Apple” and “Apfel” → Save

New pair appears; repeat as needed

### Using Quiz

All words (e.g., 7 in “Noun” + 4 in “Default”) are combined and shuffled

One English word is shown with 4 German choices

Correct: “Correct!” alert → Next word

After all words: “All Done—start again?”

**Yes:** reshuffles and restarts

**No:** stays on “Preparing quiz…”

### Persistence

+ Even after closing the app, data stays saved

+ When returning to Quiz, it builds a new shuffled pool

## Summary of Key Features

**Cross-Platform:** Built in Expo/React Native (works on iOS and Android)

**Custom Categories:** Unlimited user-defined themes

**Manual Bilingual Input:** No API dependency

**Persistent Data:** Stored with AsyncStorage

**Unique Quiz Cycle:** Each word shown once per session

**“All Done” Prompt:** Appears only after full quiz cycle


## In a Nutshell
This app is a fully offline, user-powered flashcard quiz for learning English↔German vocabulary. It lets you create custom categories, enter translations manually, and test yourself with randomized quizzes that don’t repeat words until the full cycle is complete. The architecture is simple and efficient—relying on local storage, index-based shuffling, and smooth navigation—to support flexible, personal language learning on any device.
