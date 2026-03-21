import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Включение анимаций для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Типы
type Note = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

// Константы
const STORAGE_KEY = '@notes_app_data';

export default function Index() {
  // Тема
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Состояние
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Тема цветов
  const theme = {
    bg: isDark ? '#1a1a2e' : '#f8fafc',
    card: isDark ? '#16213e' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    danger: '#ef4444',
    success: '#4ade80',
  };

  // ─────────────────────────────────────────────
  // Загрузка данных при запуске приложения
  // ─────────────────────────────────────────────
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json !== null) {
        const parsed = JSON.parse(json);
        setNotes(parsed);
      }
    } catch (e) {
      console.error('Ошибка загрузки заметок:', e);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Сохранение данных после каждого изменения
  // ─────────────────────────────────────────────
  const saveNotes = async (notesToSave: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (e) {
      console.error('Ошибка сохранения заметок:', e);
      Alert.alert('Ошибка', 'Не удалось сохранить данные');
    }
  };

  // ─────────────────────────────────────────────
  // Добавление заметки
  // ─────────────────────────────────────────────
  const addNote = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      Alert.alert('Внимание', 'Заметка не может быть пустой');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    const updatedNotes = [newNote, ...notes];
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setInputValue('');
  };

  // ─────────────────────────────────────────────
  // Удаление заметки
  // ─────────────────────────────────────────────
  const deleteNote = (id: string) => {
    Alert.alert('Подтверждение', 'Удалить заметку?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          const updatedNotes = notes.filter((note) => note.id !== id);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
          setNotes(updatedNotes);
          saveNotes(updatedNotes);
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────
  // Переключение статуса выполнения
  // ─────────────────────────────────────────────
  const toggleComplete = (id: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, completed: !note.completed } : note
    );
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // ─────────────────────────────────────────────
  // Рендер элемента списка
  // ─────────────────────────────────────────────
  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[
        styles.noteItem,
        isDark && styles.noteItemDark,
        item.completed && styles.noteItemCompleted,
      ]}
      onPress={() => toggleComplete(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.noteIconContainer}>
        <Ionicons
          name={item.completed ? 'checkbox' : 'checkbox-outline'}
          size={24}
          color={item.completed ? theme.success : (isDark ? '#888' : '#666')}
        />
      </View>
      <View style={styles.noteContent}>
        <Text
          style={[
            styles.noteText,
            isDark && styles.noteTextDark,
            item.completed && styles.noteTextCompleted,
          ]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <Text style={[styles.noteTime, isDark && styles.noteTimeDark]}>
          {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, isDark && styles.deleteButtonDark]}
        onPress={() => deleteNote(item.id)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────
  // Загрузка (экран)
  // ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.bg }]}>
        <Ionicons name="hourglass" size={48} color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Загрузка...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Основной экран
  // ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Шапка */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Заметки</Text>
            <Text style={[styles.counter, { color: theme.textSecondary }]}>
              {notes.filter((n) => !n.completed).length} активных задач
            </Text>
          </View>
          <View style={[styles.statsBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.statsText}>{notes.length}</Text>
          </View>
        </View>
      </View>

      {/* Поле ввода */}
      <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Что нужно сделать?"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={200}
          onSubmitEditing={addNote}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: inputValue.trim() ? theme.primary : theme.primaryDark },
          ]}
          onPress={addNote}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Список */}
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.border }]}>
              <Ionicons name="clipboard-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>Нет заметок</Text>
            <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
              Добавьте первую задачу выше
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Стили
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  counter: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  statsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  inputContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  noteItemDark: {
    backgroundColor: '#16213e',
  },
  noteItemCompleted: {
    opacity: 0.85,
    borderLeftColor: '#4ade80',
  },
  noteIconContainer: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  noteContent: {
    flex: 1,
    paddingRight: 8,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  noteTextDark: {
    color: '#e2e8f0',
  },
  noteTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  noteTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  noteTimeDark: {
    color: '#94a3b8',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonDark: {
    backgroundColor: '#dc2626',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
});
