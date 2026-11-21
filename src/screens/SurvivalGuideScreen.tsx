import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SurvivalGuideService } from '../services/survivalGuideService';
import { SurvivalProtocol } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { useAppStore } from '../stores/useAppStore';
import { getThemeColors } from '../theme/colors';
import { typography } from '../theme/typography';

const CATEGORIES = [
  { id: 'all', label: 'All Protocols', icon: 'all-inclusive' },
  { id: 'earthquake', label: 'Earthquake', icon: 'image-filter-hdr' },
  { id: 'collapse', label: 'Collapse', icon: 'domain-off' },
  { id: 'flood', label: 'Flood / Tsunami', icon: 'waves' },
  { id: 'fire', label: 'Fire & Smoke', icon: 'fire' },
  { id: 'hostile', label: 'Active Threat', icon: 'shield-alert' },
  { id: 'medical', label: 'Trauma First Aid', icon: 'medical-bag' },
];

export const SurvivalGuideScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>('proto-earthquake');

  const theme = useAppStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const filteredProtocols = useMemo(() => {
    let results: SurvivalProtocol[];
    if (searchQuery.trim().length > 0) {
      results = SurvivalGuideService.search(searchQuery);
      if (selectedCategory !== 'all') {
        results = results.filter((p) => p.category === selectedCategory);
      }
    } else {
      results = SurvivalGuideService.getByCategory(selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Top Navbar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Offline Survival Encyclopedia
            </Text>
            <View style={styles.zeroNetBadge}>
              <MaterialCommunityIcons name="cloud-off-outline" size={12} color="#10B981" />
              <Text style={styles.zeroNetText}>100% OFFLINE • ZERO NETWORK</Text>
            </View>
          </View>
        </View>

        {/* Instant Fuzzy Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.accentCyan} />
          <TextInput
            placeholder="Search keywords: 'rubble', 'bleeding', 'gas'..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected ? colors.accentCyanSoft : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.accentCyan : colors.cardBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? colors.accentCyan : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.catPillText,
                    { color: isSelected ? colors.accentCyan : colors.textPrimary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Protocol Cards List */}
        <ScrollView
          contentContainerStyle={styles.cardsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredProtocols.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="text-search" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No offline protocols matched '{searchQuery}'.
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Try broader keywords like 'water', 'fire', 'chest', or 'shock'.
              </Text>
            </View>
          ) : (
            filteredProtocols.map((protocol) => {
              const isExpanded = expandedId === protocol.id;
              return (
                <TouchableOpacity
                  key={protocol.id}
                  activeOpacity={0.9}
                  onPress={() => toggleExpand(protocol.id)}
                  style={styles.cardWrapper}
                >
                  <GlassCard>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor:
                                protocol.category === 'earthquake' || protocol.category === 'collapse'
                                  ? colors.accentYellowSoft
                                  : protocol.category === 'hostile' || protocol.category === 'fire'
                                  ? colors.accentRedSoft
                                  : colors.accentCyanSoft,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              {
                                color:
                                  protocol.category === 'earthquake' || protocol.category === 'collapse'
                                    ? colors.accentYellow
                                    : protocol.category === 'hostile' || protocol.category === 'fire'
                                    ? colors.accentRed
                                    : colors.accentCyan,
                              },
                            ]}
                          >
                            {protocol.category.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          {protocol.title}
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textMuted}
                      />
                    </View>

                    <Text style={[styles.cardSummary, { color: colors.textSecondary }]}>
                      {protocol.summary}
                    </Text>

                    {/* Expanded Critical Action Steps */}
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.sectionBlock}>
                          <Text style={[styles.sectionTitle, { color: colors.accentYellow }]}>
                            ⚡ CRITICAL ACTION CHECKLIST
                          </Text>
                          {protocol.criticalSteps.map((step, idx) => (
                            <View key={idx} style={styles.stepRow}>
                              <Text style={[styles.stepNumber, { color: colors.accentYellow }]}>
                                {idx + 1}.
                              </Text>
                              <Text style={[styles.stepText, { color: colors.textPrimary }]}>
                                {step}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* DOs & DONTs Split */}
                        <View style={styles.dosDontsRow}>
                          <View style={[styles.doBox, { backgroundColor: colors.accentGreenSoft, borderColor: colors.accentGreen }]}>
                            <Text style={[styles.doTitle, { color: colors.accentGreen }]}>
                              ✓ DO THIS
                            </Text>
                            {protocol.dos.map((item, idx) => (
                              <Text key={idx} style={[styles.bulletItem, { color: colors.textPrimary }]}>
                                • {item}
                              </Text>
                            ))}
                          </View>

                          <View style={[styles.dontBox, { backgroundColor: colors.accentRedSoft, borderColor: colors.accentRed }]}>
                            <Text style={[styles.dontTitle, { color: colors.accentRed }]}>
                              ✕ DO NOT DO
                            </Text>
                            {protocol.donts.map((item, idx) => (
                              <Text key={idx} style={[styles.bulletItem, { color: colors.textPrimary }]}>
                                • {item}
                              </Text>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  zeroNetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  zeroNetText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
  },
  categoryScroll: {
    paddingBottom: 10,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  catPillText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
  },
  cardsList: {
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  cardSummary: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
    paddingTop: 12,
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepNumber: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
    width: 20,
  },
  stepText: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  dosDontsRow: {
    gap: 8,
    marginTop: 4,
  },
  doBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  doTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.black,
    marginBottom: 4,
  },
  dontBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dontTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.black,
    marginBottom: 4,
  },
  bulletItem: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs - 1,
    lineHeight: 16,
    marginBottom: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptySub: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
  },
});
