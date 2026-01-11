// Team and Profile Service for Sticky Whispers
// Handles team collaboration, profiles, and statistics

class TeamService {
  constructor() {
    this.currentUser = null;
    this.currentTeam = null;
  }

  // Initialize or get user profile
  async getUserProfile() {
    const result = await chrome.storage.local.get(['userProfile']);
    
    if (!result.userProfile) {
      // Create new profile
      const profile = {
        id: this.generateUserId(),
        username: 'User' + Math.floor(Math.random() * 10000),
        createdAt: new Date().toISOString(),
        stats: {
          totalWhispers: 0,
          sharedWhispers: 0,
          articlesRead: 0,
          teamContributions: 0
        },
        teams: []
      };
      
      await chrome.storage.local.set({ userProfile: profile });
      this.currentUser = profile;
      return profile;
    }
    
    this.currentUser = result.userProfile;
    return result.userProfile;
  }

  // Update user stats
  async updateStats(statType, increment = 1) {
    const profile = await this.getUserProfile();
    
    if (profile.stats[statType] !== undefined) {
      profile.stats[statType] += increment;
      await chrome.storage.local.set({ userProfile: profile });
    }
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate team code
  generateTeamCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new team
  async createTeam(teamName) {
    const profile = await this.getUserProfile();
    const teamCode = this.generateTeamCode();
    
    const team = {
      code: teamCode,
      name: teamName,
      createdBy: profile.id,
      createdAt: new Date().toISOString(),
      members: [profile.id],
      whispers: []
    };

    // Add team to user's teams
    profile.teams.push(teamCode);
    await chrome.storage.local.set({ userProfile: profile });

    // Store team data
    const teamsData = await chrome.storage.local.get(['teams']) || { teams: {} };
    if (!teamsData.teams) teamsData.teams = {};
    teamsData.teams[teamCode] = team;
    await chrome.storage.local.set({ teams: teamsData.teams });

    this.currentTeam = team;
    return team;
  }

  // Join existing team
  async joinTeam(teamCode) {
    const profile = await this.getUserProfile();
    const teamsData = await chrome.storage.local.get(['teams']);
    
    if (!teamsData.teams || !teamsData.teams[teamCode]) {
      throw new Error('Team not found');
    }

    const team = teamsData.teams[teamCode];
    
    // Add user to team if not already a member
    if (!team.members.includes(profile.id)) {
      team.members.push(profile.id);
      teamsData.teams[teamCode] = team;
      await chrome.storage.local.set({ teams: teamsData.teams });
    }

    // Add team to user's teams
    if (!profile.teams.includes(teamCode)) {
      profile.teams.push(teamCode);
      await chrome.storage.local.set({ userProfile: profile });
    }

    this.currentTeam = team;
    return team;
  }

  // Get current team
  async getCurrentTeam() {
    const result = await chrome.storage.local.get(['currentTeamCode']);
    
    if (!result.currentTeamCode) {
      return null;
    }

    const teamsData = await chrome.storage.local.get(['teams']);
    if (teamsData.teams && teamsData.teams[result.currentTeamCode]) {
      this.currentTeam = teamsData.teams[result.currentTeamCode];
      return this.currentTeam;
    }

    return null;
  }

  // Set active team
  async setActiveTeam(teamCode) {
    await chrome.storage.local.set({ currentTeamCode: teamCode });
    
    const teamsData = await chrome.storage.local.get(['teams']);
    if (teamsData.teams && teamsData.teams[teamCode]) {
      this.currentTeam = teamsData.teams[teamCode];
    }
  }

  // Share whisper with team
  async shareWhisperWithTeam(whisper, teamCode) {
    const teamsData = await chrome.storage.local.get(['teams']);
    
    if (!teamsData.teams || !teamsData.teams[teamCode]) {
      throw new Error('Team not found');
    }

    const team = teamsData.teams[teamCode];
    const profile = await this.getUserProfile();

    // Add whisper to team
    const teamWhisper = {
      ...whisper,
      sharedBy: profile.id,
      sharedByUsername: profile.username,
      sharedAt: new Date().toISOString(),
      teamCode: teamCode
    };

    team.whispers.push(teamWhisper);
    teamsData.teams[teamCode] = team;
    await chrome.storage.local.set({ teams: teamsData.teams });

    // Update user stats
    await this.updateStats('sharedWhispers');
    await this.updateStats('teamContributions');

    return teamWhisper;
  }

  // Get team whispers for current page
  async getTeamWhispersForPage(url, teamCode) {
    const teamsData = await chrome.storage.local.get(['teams']);
    
    if (!teamsData.teams || !teamsData.teams[teamCode]) {
      return [];
    }

    const team = teamsData.teams[teamCode];
    return team.whispers.filter(w => w.url === url);
  }

  // Get all user's teams
  async getUserTeams() {
    const profile = await this.getUserProfile();
    const teamsData = await chrome.storage.local.get(['teams']);
    
    if (!teamsData.teams) {
      return [];
    }

    return profile.teams.map(code => teamsData.teams[code]).filter(t => t);
  }

  // Leave team
  async leaveTeam(teamCode) {
    const profile = await this.getUserProfile();
    const teamsData = await chrome.storage.local.get(['teams']);
    
    if (teamsData.teams && teamsData.teams[teamCode]) {
      const team = teamsData.teams[teamCode];
      team.members = team.members.filter(id => id !== profile.id);
      teamsData.teams[teamCode] = team;
      await chrome.storage.local.set({ teams: teamsData.teams });
    }

    profile.teams = profile.teams.filter(code => code !== teamCode);
    await chrome.storage.local.set({ userProfile: profile });

    // Clear active team if it was this one
    const current = await chrome.storage.local.get(['currentTeamCode']);
    if (current.currentTeamCode === teamCode) {
      await chrome.storage.local.remove('currentTeamCode');
      this.currentTeam = null;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TeamService;
}

