// Enhanced InkFlow Studio JavaScript
// This file contains all the additional functionality and fixes

// User Authentication System
class UserAuth {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.users = JSON.parse(localStorage.getItem('inkflowUsers')) || [];
        this.communityArtworks = JSON.parse(localStorage.getItem('inkflowCommunity')) || [];
    }

    // Generate random username that can't be changed
    generateRandomUsername() {
        const adjectives = ['Pixel', 'Digital', 'Creative', 'Artistic', 'Visual', 'Graphic', 'Colorful', 'Vivid', 'Neon', 'Cyber'];
        const nouns = ['Artist', 'Creator', 'Designer', 'Illustrator', 'Painter', 'Sketch', 'Master', 'Wizard', 'Dreamer', 'Visionary'];
        const randomNum = Math.floor(Math.random() * 1000);
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adjective}${noun}${randomNum}`;
    }

    // Register new user with random username
    registerUser(email, password) {
        // Check if email already exists
        if (this.users.some(u => u.email === email)) {
            return { success: false, message: "Email already exists" };
        }

        // Generate random username that can't be changed
        const username = this.generateRandomUsername();

        // Create new user
        const newUser = {
            id: Date.now(),
            username: username, // This will be the permanent username
            email: email,
            password: password,
            displayName: username, // Can be changed later
            bio: "",
            about: "",
            artworks: 0,
            followers: 0,
            following: 0,
            projects: 0,
            avatarColor1: "#5d2d91",
            avatarColor2: "#8a2be2",
            bannerGradient: "linear-gradient(135deg, #5d2d91, #8a2be2, #4fc3f7)",
            contactLinks: [],
            skills: [],
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('inkflowUsers', JSON.stringify(this.users));

        // Log in the new user
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        return { success: true, user: newUser, message: `Welcome to InkFlow, ${username}!` };
    }

    // Login user
    loginUser(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return { success: true, user: user, message: `Welcome back, ${user.username}!` };
        }
        return { success: false, message: "Invalid email or password" };
    }

    // Logout user
    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        return { success: true, message: "Logged out successfully" };
    }

    // Update user profile (but not username)
    updateProfile(profileData) {
        if (!this.currentUser) return { success: false, message: "No user logged in" };

        // Update allowed fields (not username)
        Object.keys(profileData).forEach(key => {
            if (key !== 'username') { // Username cannot be changed
                this.currentUser[key] = profileData[key];
            }
        });

        // Update in users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = this.currentUser;
        }

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('inkflowUsers', JSON.stringify(this.users));

        return { success: true, message: "Profile updated successfully" };
    }

    // Upload artwork to community
    uploadArtwork(artworkData) {
        if (!this.currentUser) return { success: false, message: "Please log in to upload artwork" };

        const newArtwork = {
            id: Date.now(),
            title: artworkData.title,
            author: this.currentUser.username, // Use the permanent username
            image: artworkData.image,
            description: artworkData.description,
            tags: artworkData.tags || [],
            visibility: artworkData.visibility || 'public',
            likes: 0,
            comments: 0,
            views: 0,
            likedBy: [],
            commentsList: [],
            createdAt: new Date().toISOString()
        };

        this.communityArtworks.unshift(newArtwork);
        localStorage.setItem('inkflowCommunity', JSON.stringify(this.communityArtworks));

        // Update user's artwork count
        this.currentUser.artworks = (this.currentUser.artworks || 0) + 1;
        this.updateProfile({ artworks: this.currentUser.artworks });

        return { success: true, artwork: newArtwork, message: `Artwork "${artworkData.title}" uploaded successfully!` };
    }

    // Get community artworks
    getCommunityArtworks() {
        return this.communityArtworks;
    }

    // Like artwork
    likeArtwork(artworkId) {
        if (!this.currentUser) return { success: false, message: "Please log in to like artwork" };

        const artwork = this.communityArtworks.find(a => a.id === artworkId);
        if (!artwork) return { success: false, message: "Artwork not found" };

        const userLiked = artwork.likedBy.includes(this.currentUser.id);
        
        if (!userLiked) {
            artwork.likedBy.push(this.currentUser.id);
            artwork.likes++;
        } else {
            const index = artwork.likedBy.indexOf(this.currentUser.id);
            artwork.likedBy.splice(index, 1);
            artwork.likes--;
        }

        localStorage.setItem('inkflowCommunity', JSON.stringify(this.communityArtworks));
        return { success: true, liked: !userLiked, likes: artwork.likes };
    }

    // Add comment to artwork
    addComment(artworkId, commentText) {
        if (!this.currentUser) return { success: false, message: "Please log in to comment" };

        const artwork = this.communityArtworks.find(a => a.id === artworkId);
        if (!artwork) return { success: false, message: "Artwork not found" };

        const newComment = {
            id: Date.now(),
            author: this.currentUser.username,
            content: commentText,
            date: new Date().toISOString().split('T')[0]
        };

        artwork.commentsList.push(newComment);
        artwork.comments++;
        localStorage.setItem('inkflowCommunity', JSON.stringify(this.communityArtworks));

        return { success: true, comment: newComment, message: "Comment added successfully" };
    }
}

// Profile Management System
class ProfileManager {
    constructor(userAuth) {
        this.userAuth = userAuth;
    }

    // Upload profile picture
    uploadProfilePicture(file) {
        return new Promise((resolve, reject) => {
            if (!this.userAuth.currentUser) {
                reject("No user logged in");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                this.userAuth.updateProfile({ avatarImage: imageData });
                resolve(imageData);
            };
            reader.onerror = () => reject("Failed to read file");
            reader.readAsDataURL(file);
        });
    }

    // Upload banner picture
    uploadBannerPicture(file) {
        return new Promise((resolve, reject) => {
            if (!this.userAuth.currentUser) {
                reject("No user logged in");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                this.userAuth.updateProfile({ bannerImage: imageData });
                resolve(imageData);
            };
            reader.onerror = () => reject("Failed to read file");
            reader.readAsDataURL(file);
        });
    }

    // Add social link
    addSocialLink(type, url) {
        if (!this.userAuth.currentUser) return { success: false, message: "No user logged in" };

        const contactLinks = this.userAuth.currentUser.contactLinks || [];
        contactLinks.push({ type, url });
        
        return this.userAuth.updateProfile({ contactLinks });
    }

    // Remove social link
    removeSocialLink(type, url) {
        if (!this.userAuth.currentUser) return { success: false, message: "No user logged in" };

        const contactLinks = this.userAuth.currentUser.contactLinks || [];
        const filteredLinks = contactLinks.filter(link => !(link.type === type && link.url === url));
        
        return this.userAuth.updateProfile({ contactLinks: filteredLinks });
    }

    // Add skill
    addSkill(skill) {
        if (!this.userAuth.currentUser) return { success: false, message: "No user logged in" };

        const skills = this.userAuth.currentUser.skills || [];
        if (!skills.includes(skill)) {
            skills.push(skill);
            return this.userAuth.updateProfile({ skills });
        }
        return { success: false, message: "Skill already exists" };
    }

    // Remove skill
    removeSkill(skill) {
        if (!this.userAuth.currentUser) return { success: false, message: "No user logged in" };

        const skills = this.userAuth.currentUser.skills || [];
        const filteredSkills = skills.filter(s => s !== skill);
        
        return this.userAuth.updateProfile({ skills: filteredSkills });
    }
}

// Animation System
class AnimationSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.frames = [];
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameSpeed = 300; // ms per frame
        this.animationLoop = true;
        this.animationTimeout = null;
    }

    // Add frame
    addFrame() {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = this.canvas.width;
        frameCanvas.height = this.canvas.height;
        const frameCtx = frameCanvas.getContext('2d');
        frameCtx.drawImage(this.canvas, 0, 0);
        
        this.frames.push(frameCanvas);
        this.currentFrame = this.frames.length - 1;
        return this.frames.length;
    }

    // Delete frame
    deleteFrame() {
        if (this.frames.length <= 1) return false;
        
        this.frames.splice(this.currentFrame, 1);
        if (this.currentFrame >= this.frames.length) {
            this.currentFrame = this.frames.length - 1;
        }
        return true;
    }

    // Play animation
    play() {
        if (this.frames.length === 0) return;
        
        this.isPlaying = true;
        this.playNextFrame();
    }

    // Stop animation
    stop() {
        this.isPlaying = false;
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }

    // Play next frame
    playNextFrame() {
        if (!this.isPlaying) return;

        if (this.currentFrame < this.frames.length - 1) {
            this.currentFrame++;
        } else if (this.animationLoop) {
            this.currentFrame = 0;
        } else {
            this.isPlaying = false;
            return;
        }

        this.renderCurrentFrame();
        this.animationTimeout = setTimeout(() => this.playNextFrame(), this.frameSpeed);
    }

    // Render current frame
    renderCurrentFrame() {
        if (this.frames.length === 0) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.frames[this.currentFrame], 0, 0);
    }

    // Set frame speed
    setFrameSpeed(speed) {
        this.frameSpeed = speed;
    }

    // Set loop
    setLoop(loop) {
        this.animationLoop = loop;
    }

    // Export animation as GIF (simplified)
    exportAnimation() {
        // This would require a GIF library like gif.js
        // For now, we'll just export the frames as separate images
        const zip = new JSZip();
        
        this.frames.forEach((frame, index) => {
            const dataURL = frame.toDataURL('image/png');
            const base64Data = dataURL.split(',')[1];
            zip.file(`frame_${index + 1}.png`, base64Data, {base64: true});
        });

        zip.generateAsync({type: 'blob'}).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'inkflow-animation.zip';
            link.click();
        });
    }
}

// Initialize the enhanced systems
let userAuth, profileManager, animationSystem;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize systems
    userAuth = new UserAuth();
    profileManager = new ProfileManager(userAuth);
    
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        animationSystem = new AnimationSystem(canvas);
    }

    // Set up event listeners for authentication
    setupAuthEventListeners();
    
    // Set up profile management
    setupProfileEventListeners();
    
    // Set up animation controls
    setupAnimationEventListeners();
    
    // Initialize UI
    updateUserUI();
    renderCommunityGallery();
});

// Setup authentication event listeners
function setupAuthEventListeners() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Show login modal
            showAuthModal('login');
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            // Show register modal
            showAuthModal('register');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const result = userAuth.logoutUser();
            if (result.success) {
                updateUserUI();
                showNotification('Success', result.message);
            }
        });
    }
}

// Setup profile event listeners
function setupProfileEventListeners() {
    // Profile picture upload
    const editAvatar = document.getElementById('edit-avatar');
    if (editAvatar) {
        editAvatar.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    profileManager.uploadProfilePicture(file).then(() => {
                        updateUserUI();
                        showNotification('Success', 'Profile picture updated!');
                    }).catch(error => {
                        showNotification('Error', error);
                    });
                }
            });
            input.click();
        });
    }

    // Banner picture upload
    const editBanner = document.getElementById('edit-banner');
    if (editBanner) {
        editBanner.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    profileManager.uploadBannerPicture(file).then(() => {
                        updateUserUI();
                        showNotification('Success', 'Banner picture updated!');
                    }).catch(error => {
                        showNotification('Error', error);
                    });
                }
            });
            input.click();
        });
    }
}

// Setup animation event listeners
function setupAnimationEventListeners() {
    const toggleAnimationBtn = document.getElementById('toggle-animation');
    const addFrameBtn = document.getElementById('add-frame');
    const playAnimationBtn = document.getElementById('play-animation');
    const deleteFrameBtn = document.getElementById('delete-frame');

    if (toggleAnimationBtn) {
        toggleAnimationBtn.addEventListener('click', () => {
            // Toggle animation mode
            const timeline = document.getElementById('animation-timeline');
            if (timeline) {
                timeline.classList.toggle('active');
            }
        });
    }

    if (addFrameBtn) {
        addFrameBtn.addEventListener('click', () => {
            if (animationSystem) {
                animationSystem.addFrame();
                renderFrames();
            }
        });
    }

    if (playAnimationBtn) {
        playAnimationBtn.addEventListener('click', () => {
            if (animationSystem) {
                if (animationSystem.isPlaying) {
                    animationSystem.stop();
                    playAnimationBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                } else {
                    animationSystem.play();
                    playAnimationBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                }
            }
        });
    }

    if (deleteFrameBtn) {
        deleteFrameBtn.addEventListener('click', () => {
            if (animationSystem) {
                if (animationSystem.deleteFrame()) {
                    renderFrames();
                }
            }
        });
    }
}

// Utility functions
function showNotification(title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-modal show';
    notification.innerHTML = `
        <div class="notification-icon"><i class="fas fa-bell"></i></div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

function updateUserUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const avatarInitial = document.getElementById('avatar-initial');

    if (userAuth.currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = userAuth.currentUser.username;
        if (avatarInitial) avatarInitial.textContent = userAuth.currentUser.username.charAt(0).toUpperCase();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
    }
}

function renderCommunityGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';
    const artworks = userAuth.getCommunityArtworks();

    artworks.forEach(artwork => {
        const artworkCard = document.createElement('div');
        artworkCard.className = 'artwork-card';
        artworkCard.innerHTML = `
            <img src="${artwork.image}" alt="${artwork.title}" class="artwork-image">
            <div class="artwork-info">
                <h3 class="artwork-title">${artwork.title}</h3>
                <div class="profile-author">By ${artwork.author}</div>
                <div class="artwork-stats">
                    <div class="stat"><i class="fas fa-heart"></i> ${artwork.likes}</div>
                    <div class="stat"><i class="fas fa-comment"></i> ${artwork.comments}</div>
                    <div class="stat"><i class="fas fa-eye"></i> ${artwork.views}</div>
                </div>
            </div>
        `;
        galleryGrid.appendChild(artworkCard);
    });
}

function renderFrames() {
    const timelineFrames = document.getElementById('timeline-frames');
    if (!timelineFrames || !animationSystem) return;

    timelineFrames.innerHTML = '';
    animationSystem.frames.forEach((frame, index) => {
        const frameEl = document.createElement('div');
        frameEl.className = `frame ${index === animationSystem.currentFrame ? 'active' : ''}`;
        frameEl.dataset.index = index;
        frameEl.innerHTML = `
            <img src="${frame.toDataURL()}">
            <div class="frame-number">${index + 1}</div>
        `;
        frameEl.addEventListener('click', () => {
            animationSystem.currentFrame = index;
            animationSystem.renderCurrentFrame();
            renderFrames();
        });
        timelineFrames.appendChild(frameEl);
    });
}

// Export functions for use in main HTML
window.InkFlow = {
    userAuth,
    profileManager,
    animationSystem,
    showNotification,
    updateUserUI,
    renderCommunityGallery
};
