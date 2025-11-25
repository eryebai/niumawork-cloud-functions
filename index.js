/**
 * 牛马Work - LeanCloud云函数（完整版）
 * 
 * 包含：
 * 1. 原有的用户端云函数
 * 2. 新增的管理员工具云函数（已添加Master Key安全控制）
 * 
 * 使用说明：
 * 将本文件的所有内容复制到LeanCloud云引擎的index.js中
 * 然后点击"部署"按钮
 */

const AV = require('leanengine');

// ==================== 原有数据 ====================

// 初始化软件数据
const INITIAL_SOFTWARE_DATA = [
  {
    name: "Adobe Photoshop 2024",
    category: "图像处理",
    version: "25.0.0",
    size: "2.1GB",
    description: "业界领先的图像编辑软件，提供强大的照片编辑和设计工具。支持RAW格式处理，智能AI功能，专业级色彩管理。",
    features: ["智能AI编辑", "RAW格式支持", "3D设计工具", "视频编辑", "云同步"],
    downloadUrl: "https://example.com/downloads/photoshop-2024.exe",
    tags: ["Adobe", "设计", "图像处理", "专业软件"],
    rating: 4.8,
    downloadCount: 150000,
    status: "active"
  },
  {
    name: "Microsoft Office 2021",
    category: "办公软件", 
    version: "16.0.0",
    size: "3.5GB",
    description: "微软最新办公套件，包含Word、Excel、PowerPoint等应用。提升工作效率，支持云协作和AI助手功能。",
    features: ["Word文档处理", "Excel数据分析", "PowerPoint演示", "Outlook邮件", "Teams协作"],
    downloadUrl: "https://example.com/downloads/office-2021.exe",
    tags: ["Microsoft", "办公", "文档", "表格"],
    rating: 4.6,
    downloadCount: 200000,
    status: "active"
  },
  {
    name: "AutoCAD 2024",
    category: "设计工具",
    version: "24.0.0", 
    size: "1.8GB",
    description: "专业CAD设计软件，适用于建筑、工程、制造等行业。提供精确的2D和3D设计工具。",
    features: ["2D绘图", "3D建模", "参数化设计", "云协作", "移动端支持"],
    downloadUrl: "https://example.com/downloads/autocad-2024.exe",
    tags: ["AutoCAD", "CAD", "设计", "工程"],
    rating: 4.7,
    downloadCount: 80000,
    status: "active"
  },
  {
    name: "Visual Studio Code",
    category: "开发工具",
    version: "1.85.0",
    size: "85MB",
    description: "免费的代码编辑器，支持多种编程语言，丰富的插件生态，内置Git支持和调试功能。",
    features: ["语法高亮", "智能提示", "Git集成", "插件扩展", "调试工具"],
    downloadUrl: "https://example.com/downloads/vscode.exe",
    tags: ["编程", "开发", "编辑器", "免费"],
    rating: 4.9,
    downloadCount: 500000,
    status: "active"
  },
  {
    name: "Chrome浏览器",
    category: "网络工具",
    version: "120.0.0",
    size: "90MB", 
    description: "Google开发的网页浏览器，快速、安全、易用。支持丰富的扩展程序和同步功能。",
    features: ["快速浏览", "安全防护", "扩展支持", "多设备同步", "开发者工具"],
    downloadUrl: "https://example.com/downloads/chrome.exe",
    tags: ["浏览器", "Google", "网络", "免费"],
    rating: 4.5,
    downloadCount: 1000000,
    status: "active"
  },
  {
    name: "WinRAR",
    category: "系统工具",
    version: "6.24",
    size: "3MB",
    description: "强大的压缩解压软件，支持多种压缩格式，压缩率高，操作简便。",
    features: ["多格式支持", "高压缩率", "密码保护", "分卷压缩", "修复功能"],
    downloadUrl: "https://example.com/downloads/winrar.exe", 
    tags: ["压缩", "解压", "工具", "RAR"],
    rating: 4.4,
    downloadCount: 300000,
    status: "active"
  }
];

// ==================== 原有云函数 ====================

/**
 * 初始化数据库和数据
 */
AV.Cloud.define('initDatabase', async (request) => {
  try {
    console.log('开始初始化所有数据库表...');
    const results = {};

    // 1. 初始化 SoftwareInfo 表
    let softwareCount = 0;
    try {
      const SoftwareInfo = AV.Object.extend('SoftwareInfo');
      const query = new AV.Query(SoftwareInfo);
      softwareCount = await query.count();
    } catch (error) {
      console.log('SoftwareInfo表不存在，将创建并初始化数据');
    }

    if (softwareCount === 0) {
      const SoftwareInfo = AV.Object.extend('SoftwareInfo');
      const softwareObjects = INITIAL_SOFTWARE_DATA.map(data => {
        const software = new SoftwareInfo();
        Object.keys(data).forEach(key => {
          software.set(key, data[key]);
        });
        return software;
      });
      
      await AV.Object.saveAll(softwareObjects);
      console.log(`已初始化 ${INITIAL_SOFTWARE_DATA.length} 条软件数据`);
      results.SoftwareInfo = `已初始化 ${INITIAL_SOFTWARE_DATA.length} 条软件数据`;
    } else {
      results.SoftwareInfo = `表已存在，共 ${softwareCount} 条数据`;
    }

    // 2. 初始化 UserDevice 表
    const UserDevice = AV.Object.extend('UserDevice');
    let deviceCount = 0;
    try {
      const deviceQuery = new AV.Query(UserDevice);
      deviceCount = await deviceQuery.count();
    } catch (error) {
      console.log('UserDevice表不存在，将创建表结构');
    }
    
    if (deviceCount === 0) {
      try {
        const tempDevice = new UserDevice();
        tempDevice.set('machineId', 'temp_init_device');
        tempDevice.set('hardwareInfo', {
          cpu: 'init',
          disk: 'init', 
          mac: 'init',
          motherboard: 'init',
          os: 'init'
        });
        tempDevice.set('status', 'temp');
        tempDevice.set('registeredAt', new Date());
        
        await tempDevice.save();
        await tempDevice.destroy();
        
        results.UserDevice = '表已创建，等待真实设备注册';
      } catch (error) {
        console.error('创建UserDevice表失败:', error);
        results.UserDevice = '表创建失败: ' + error.message;
      }
    } else {
      results.UserDevice = `表已存在，共 ${deviceCount} 条设备记录`;
    }

    // 3. 初始化 DailyAuthCode 表
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    let codeCount = 0;
    try {
      const codeQuery = new AV.Query(DailyAuthCode);
      codeCount = await codeQuery.count();
    } catch (error) {
      console.log('DailyAuthCode表不存在，将创建表结构');
    }
    
    if (codeCount === 0) {
      try {
        const tempCode = new DailyAuthCode();
        tempCode.set('userId', 'temp_init_user');
        tempCode.set('machineId', 'temp_init_machine');
        tempCode.set('code', 'TEMP00');
        tempCode.set('generatedAt', new Date());
        tempCode.set('expiresAt', new Date());
        tempCode.set('status', 'temp');
        
        await tempCode.save();
        await tempCode.destroy();
        
        results.DailyAuthCode = '表已创建，等待验证码生成';
      } catch (error) {
        console.error('创建DailyAuthCode表失败:', error);
        results.DailyAuthCode = '表创建失败: ' + error.message;
      }
    } else {
      results.DailyAuthCode = `表已存在，共 ${codeCount} 条验证码记录`;
    }

    // 4. 初始化 AdWatchRecord 表
    const AdWatchRecord = AV.Object.extend('AdWatchRecord');
    let adCount = 0;
    try {
      const adQuery = new AV.Query(AdWatchRecord);
      adCount = await adQuery.count();
    } catch (error) {
      console.log('AdWatchRecord表不存在，将创建表结构');
    }
    
    if (adCount === 0) {
      try {
        const tempAd = new AdWatchRecord();
        tempAd.set('userId', 'temp_init_user');
        tempAd.set('machineId', 'temp_init_machine');
        tempAd.set('adType', 'temp');
        tempAd.set('watchProgress', 0);
        tempAd.set('completedAt', new Date());
        tempAd.set('status', 'temp');
        
        await tempAd.save();
        await tempAd.destroy();
        
        results.AdWatchRecord = '表已创建，等待广告观看记录';
      } catch (error) {
        console.error('创建AdWatchRecord表失败:', error);
        results.AdWatchRecord = '表创建失败: ' + error.message;
      }
    } else {
      results.AdWatchRecord = `表已存在，共 ${adCount} 条广告记录`;
    }

    // 5. 初始化 UsageStatistics 表
    const UsageStatistics = AV.Object.extend('UsageStatistics');
    let statsCount = 0;
    try {
      const statsQuery = new AV.Query(UsageStatistics);
      statsCount = await statsQuery.count();
    } catch (error) {
      console.log('UsageStatistics表不存在，将创建表结构');
    }
    
    if (statsCount === 0) {
      try {
        const tempStats = new UsageStatistics();
        tempStats.set('userId', 'temp_init_user');
        tempStats.set('action', 'temp_init');
        tempStats.set('details', { init: true });
        tempStats.set('timestamp', new Date());
        
        await tempStats.save();
        await tempStats.destroy();
        
        results.UsageStatistics = '表已创建，等待使用统计';
      } catch (error) {
        console.error('创建UsageStatistics表失败:', error);
        results.UsageStatistics = '表创建失败: ' + error.message;
      }
    } else {
      results.UsageStatistics = `表已存在，共 ${statsCount} 条统计记录`;
    }

    return {
      success: true,
      message: '所有数据库表初始化完成',
      data: results
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    };
  }
});

/**
 * 设备注册功能（支持软件ID隔离）
 */
AV.Cloud.define('registerDevice', async (request) => {
  try {
    const { hardwareInfo, softwareId, deviceId, machineId } = request.params;

    if (!hardwareInfo) {
      return {
        success: false,
        message: '硬件信息不能为空'
      };
    }

    let finalMachineId = machineId || deviceId;

    if (!finalMachineId) {
      return {
        success: false,
        message: '设备ID或机器指纹不能为空'
      };
    }

    const UserDevice = AV.Object.extend('UserDevice');
    const query = new AV.Query(UserDevice);
    query.equalTo('machineId', finalMachineId);

    let device = await query.first();

    const isRealHardware = hardwareInfo.source === 'desktop_software';
    const deviceType = isRealHardware ? 'desktop' : 'browser';

    if (device) {
      device.set('lastActiveTime', new Date());
      device.set('totalUsageDays', (device.get('totalUsageDays') || 0) + 1);
      device.set('deviceType', deviceType);

      if (softwareId) {
        device.set('softwareId', softwareId);
      }

      if (isRealHardware) {
        device.set('realHardwareInfo', hardwareInfo);
        device.set('isRealHardware', true);
      }

      await device.save();

      return {
        success: true,
        message: `设备信息已更新 (${deviceType}${softwareId ? `, 软件: ${softwareId}` : ''})`,
        data: {
          machineId: finalMachineId,
          softwareId: softwareId,
          isNewDevice: false,
          deviceType: deviceType,
          isRealHardware: isRealHardware,
          lastActiveTime: device.get('lastActiveTime'),
          totalUsageDays: device.get('totalUsageDays')
        }
      };
    } else {
      device = new UserDevice();
      device.set('machineId', finalMachineId);
      device.set('deviceInfo', hardwareInfo);
      device.set('deviceType', deviceType);
      device.set('isRealHardware', isRealHardware);
      device.set('firstRegisterTime', new Date());
      device.set('lastActiveTime', new Date());
      device.set('totalUsageDays', 1);
      device.set('status', 'active');

      if (softwareId) {
        device.set('softwareId', softwareId);
      }

      if (isRealHardware) {
        device.set('realHardwareInfo', hardwareInfo);
      }

      await device.save();

      return {
        success: true,
        message: `设备注册成功 (${deviceType}${softwareId ? `, 软件: ${softwareId}` : ''})`,
        data: {
          machineId: finalMachineId,
          softwareId: softwareId,
          isNewDevice: true,
          deviceType: deviceType,
          isRealHardware: isRealHardware,
          firstRegisterTime: device.get('firstRegisterTime'),
          totalUsageDays: 1
        }
      };
    }
  } catch (error) {
    console.error('设备注册失败:', error);
    return {
      success: false,
      message: '设备注册失败，请重试',
      error: error.message
    };
  }
});

/**
 * 获取服务器时间
 */
AV.Cloud.define('getServerTime', async (request) => {
  try {
    const now = new Date();

    return {
      success: true,
      data: {
        serverTime: now.toISOString(),
        timestamp: now.getTime(),
        serverDate: now.toDateString(),
        timezone: 'UTC+8'
      }
    };
  } catch (error) {
    console.error('获取服务器时间失败:', error);
    return {
      success: false,
      message: '获取服务器时间失败',
      error: error.message
    };
  }
});

/**
 * 检查设备注册状态
 */
AV.Cloud.define('checkDeviceRegistration', async (request) => {
  try {
    const { machineId, softwareId } = request.params;

    if (!machineId) {
      return {
        success: false,
        message: '机器指纹不能为空'
      };
    }

    const UserDevice = AV.Object.extend('UserDevice');
    const query = new AV.Query(UserDevice);
    query.equalTo('machineId', machineId);

    const device = await query.first();

    if (device) {
      device.set('lastCheckTime', new Date());
      await device.save();

      return {
        success: true,
        message: '设备已注册',
        data: {
          machineId: machineId,
          softwareId: device.get('softwareId'),
          deviceType: device.get('deviceType'),
          isRegistered: true,
          lastActiveTime: device.get('lastActiveTime'),
          totalUsageDays: device.get('totalUsageDays')
        }
      };
    } else {
      return {
        success: false,
        message: '设备未注册',
        data: {
          machineId: machineId,
          isRegistered: false
        }
      };
    }
  } catch (error) {
    console.error('检查设备注册状态失败:', error);
    return {
      success: false,
      message: '检查设备注册状态失败',
      error: error.message
    };
  }
});

/**
 * 记录使用统计
 */
async function recordUsageStatistics(userId, action, details = {}) {
  try {
    if (!userId || !action) {
      console.warn('使用统计参数不完整:', { userId, action });
      return;
    }
    
    const UsageStatistics = AV.Object.extend('UsageStatistics');
    const stat = new UsageStatistics();
    
    stat.set('userId', userId);
    stat.set('action', action);
    stat.set('details', details);
    stat.set('timestamp', new Date());
    
    await stat.save();
    console.log('使用统计记录成功:', action);
  } catch (error) {
    console.error('记录使用统计失败:', error);
  }
}

/**
 * 搜索软件
 */
AV.Cloud.define('searchSoftware', async (request) => {
  try {
    const { keyword, category, page = 1, limit = 20 } = request.params;
    
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    let query = new AV.Query(SoftwareInfo);
    
    query.equalTo('status', 'active');
    
    if (keyword) {
      const nameQuery = new AV.Query(SoftwareInfo);
      nameQuery.contains('name', keyword);
      
      const descQuery = new AV.Query(SoftwareInfo);
      descQuery.contains('description', keyword);
      
      const tagQuery = new AV.Query(SoftwareInfo);
      tagQuery.containsAll('tags', [keyword]);
      
      query = AV.Query.or(nameQuery, descQuery, tagQuery);
      query.equalTo('status', 'active');
    }
    
    if (category) {
      query.equalTo('category', category);
    }
    
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('downloadCount');
    
    const results = await query.find();
    const total = await query.count();
    
    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description.substring(0, 100) + '...',
        rating: data.rating,
        downloadCount: data.downloadCount,
        tags: data.tags || []
      };
    });
    
    return {
      success: true,
      data: {
        results: softwareList,
        total,
        page,
        limit,
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('搜索软件失败:', error);
    return {
      success: false,
      message: '搜索失败，请重试',
      error: error.message
    };
  }
});

/**
 * 获取软件详情
 */
AV.Cloud.define('getSoftwareDetail', async (request) => {
  try {
    const { softwareId, userId } = request.params;
    
    if (!softwareId) {
      return {
        success: false,
        message: '软件ID不能为空'
      };
    }
    
    if (userId) {
      const AdCompletion = AV.Object.extend('AdCompletion');
      const adQuery = new AV.Query(AdCompletion);
      adQuery.equalTo('userId', userId);
      adQuery.equalTo('adType', 'detail');
      adQuery.equalTo('softwareId', softwareId);
      adQuery.greaterThan('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      const adCompletion = await adQuery.first();
      if (!adCompletion) {
        return {
          success: false,
          message: '请先观看广告后查看详情',
          requireAd: true
        };
      }
    }
    
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    const query = new AV.Query(SoftwareInfo);
    const software = await query.get(softwareId);
    
    if (!software) {
      return {
        success: false,
        message: '软件不存在'
      };
    }
    
    const data = software.toJSON();
    return {
      success: true,
      data: {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description,
        features: data.features || [],
        downloadUrl: data.downloadUrl,
        tags: data.tags || [],
        rating: data.rating,
        downloadCount: data.downloadCount
      }
    };
  } catch (error) {
    console.error('获取软件详情失败:', error);
    return {
      success: false,
      message: '获取详情失败，请重试',
      error: error.message
    };
  }
});

/**
 * 生成验证码（支持软件ID隔离）
 * ===== 已添加广告开关检查逻辑 =====
 */
AV.Cloud.define('generateAuthCode', async (request) => {
  try {
    const { userId, hardwareInfo, softwareId, machineId } = request.params;

    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }

    if (!machineId) {
      return {
        success: false,
        message: '机器指纹不能为空'
      };
    }

    const finalMachineId = machineId;

    const UserDevice = AV.Object.extend('UserDevice');
    const deviceQuery = new AV.Query(UserDevice);
    deviceQuery.equalTo('machineId', finalMachineId);
    const device = await deviceQuery.first();

    if (!device) {
      return {
        success: false,
        message: '设备未注册，请先注册设备',
        code: 'DEVICE_NOT_REGISTERED'
      };
    }
    
    // ===== 新增：检查广告开关状态 =====
    let adEnabled = true;
    try {
      const adStatusQuery = new AV.Query('SystemConfig');
      adStatusQuery.equalTo('configKey', 'ad_enabled');
      const adConfig = await adStatusQuery.first();
      
      if (adConfig && adConfig.get('configValue')) {
        adEnabled = adConfig.get('configValue').enabled !== false;
      }
      console.log('广告开关状态:', adEnabled);
    } catch (error) {
      console.log('获取广告开关状态失败，默认开启:', error);
      adEnabled = true;
    }
    
    // 检查今日是否已生成过验证码
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    const query = new AV.Query(DailyAuthCode);
    query.equalTo('userId', userId);
    query.equalTo('machineId', finalMachineId);
    query.greaterThanOrEqualTo('generatedAt', today);
    query.lessThan('generatedAt', tomorrow);
    query.containedIn('status', ['active', 'used']);
    
    const existingCode = await query.first();
    if (existingCode) {
      return {
        success: true,
        data: {
          code: existingCode.get('code'),
          expiryTime: '23:59:59',
          isNew: false,
          message: '今日验证码已生成',
          machineId: finalMachineId
        }
      };
    }
    
    // ===== 新增：如果广告开启，检查是否观看过广告 =====
    if (adEnabled) {
      const AdWatchRecord = AV.Object.extend('AdWatchRecord');
      const adQuery = new AV.Query(AdWatchRecord);
      adQuery.equalTo('userId', userId);
      adQuery.equalTo('machineId', finalMachineId);
      adQuery.equalTo('adType', 'authcode');
      adQuery.greaterThanOrEqualTo('completedAt', today);
      adQuery.lessThan('completedAt', tomorrow);
      adQuery.equalTo('status', 'completed');
      
      const adRecord = await adQuery.first();
      
      if (!adRecord) {
        return {
          success: false,
          message: '请先观看广告后获取验证码',
          code: 'AD_NOT_WATCHED',
          requireAd: true
        };
      }
      
      console.log('用户已观看广告，允许生成验证码');
    } else {
      console.log('广告功能已关闭，直接生成验证码');
    }
    
    // 生成新的验证码（6位字母数字组合）
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    const authCode = new DailyAuthCode();
    authCode.set('userId', userId);
    authCode.set('machineId', finalMachineId);
    authCode.set('code', code);
    authCode.set('generatedAt', new Date());
    authCode.set('expiresAt', tomorrow);
    authCode.set('status', 'active');
    authCode.set('hardwareInfo', hardwareInfo || null);

    if (softwareId) {
      authCode.set('softwareId', softwareId);
    }
    
    await authCode.save();

    const confirmQuery = new AV.Query(DailyAuthCode);
    confirmQuery.equalTo('userId', userId);
    confirmQuery.equalTo('machineId', finalMachineId);
    confirmQuery.equalTo('code', code);
    confirmQuery.equalTo('status', 'active');

    const savedCode = await confirmQuery.first();
    if (!savedCode) {
      console.error('验证码保存确认失败:', { userId, machineId: finalMachineId, code });
      return {
        success: false,
        message: '验证码保存失败，请重试',
        code: 'SAVE_FAILED'
      };
    }

    console.log('验证码保存确认成功:', { userId, machineId: finalMachineId, code });

    await recordUsageStatistics(userId, 'auth_code_generated', {
      machineId: finalMachineId,
      codeLength: code.length
    });

    return {
      success: true,
      data: {
        code: code,
        expiryTime: '23:59:59',
        isNew: true,
        message: '验证码生成成功',
        machineId: finalMachineId
      }
    };
  } catch (error) {
    console.error('生成验证码失败:', error);
    return {
      success: false,
      message: '生成验证码失败，请重试',
      error: error.message
    };
  }
});

/**
 * 验证验证码（支持软件ID隔离）
 */
AV.Cloud.define('validateAuthCode', async (request) => {
  try {
    const { code, userId, hardwareInfo, softwareId, machineId } = request.params;

    if (!code) {
      return {
        success: false,
        message: '验证码不能为空'
      };
    }

    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }

    if (!machineId) {
      return {
        success: false,
        message: '机器指纹不能为空'
      };
    }

    const finalMachineId = machineId;
    
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    const query = new AV.Query(DailyAuthCode);
    query.equalTo('code', code.toUpperCase());
    query.equalTo('userId', userId);
    query.equalTo('machineId', finalMachineId);
    query.containedIn('status', ['active', 'used']);

    const authCode = await query.first();

    if (!authCode) {
      return {
        success: false,
        message: '验证码无效或设备不匹配',
        code: 'INVALID_CODE'
      };
    }
    
    const now = new Date();
    const expiresAt = authCode.get('expiresAt');
    
    if (now >= expiresAt) {
      authCode.set('status', 'expired');
      await authCode.save();
      
      return {
        success: false,
        message: '验证码已过期，请重新获取',
        code: 'CODE_EXPIRED'
      };
    }
    
    const currentStatus = authCode.get('status');
    const verifyCount = (authCode.get('verifyCount') || 0) + 1;

    if (verifyCount > 10) {
      return {
        success: false,
        message: '今日验证次数过多，请明天重新获取验证码',
        code: 'TOO_MANY_ATTEMPTS'
      };
    }

    authCode.set('verifyCount', verifyCount);
    authCode.set('lastVerifyAt', new Date());

    if (currentStatus === 'active') {
      authCode.set('status', 'used');
      authCode.set('firstUsedAt', new Date());
    }

    await authCode.save();
    
    await recordUsageStatistics(userId, 'auth_code_validated', {
      machineId: finalMachineId,
      codeUsed: code,
      validationTime: new Date()
    });

    return {
      success: true,
      message: '验证码验证成功',
      data: {
        code: authCode.get('code'),
        userId: authCode.get('userId'),
        machineId: finalMachineId,
        softwareId: softwareId,
        validUntil: expiresAt
      }
    };
  } catch (error) {
    console.error('验证验证码失败:', error);
    return {
      success: false,
      message: '验证失败，请重试',
      error: error.message
    };
  }
});

/**
 * 记录广告观看完成
 */
AV.Cloud.define('recordAdCompletion', async (request) => {
  try {
    const { userId, adType, softwareId, watchProgress } = request.params;
    
    if (!userId || !adType) {
      return {
        success: false,
        message: '参数不完整'
      };
    }
    
    if (watchProgress < 80) {
      return {
        success: false,
        message: '广告观看不完整，请重新观看'
      };
    }
    
    const AdCompletion = AV.Object.extend('AdCompletion');
    const query = new AV.Query(AdCompletion);
    query.equalTo('userId', userId);
    query.equalTo('adType', adType);
    
    if (softwareId) {
      query.equalTo('softwareId', softwareId);
    }
    
    query.greaterThan('createdAt', new Date(Date.now() - 60 * 60 * 1000));
    
    const existing = await query.first();
    if (existing) {
      return {
        success: true,
        message: '广告观看记录已存在',
        data: { alreadyExists: true }
      };
    }
    
    const completion = new AdCompletion();
    completion.set('userId', userId);
    completion.set('adType', adType);
    completion.set('watchProgress', watchProgress);
    completion.set('status', 'completed');
    
    if (softwareId) {
      completion.set('softwareId', softwareId);
    }
    
    await completion.save();
    
    return {
      success: true,
      message: '广告观看记录保存成功',
      data: {
        adType,
        watchProgress,
        completedAt: new Date()
      }
    };
  } catch (error) {
    console.error('记录广告完成失败:', error);
    return {
      success: false,
      message: '记录失败，请重试',
      error: error.message
    };
  }
});

/**
 * 获取软件列表（用于下载页面）
 */
AV.Cloud.define('getSoftwareList', async (request) => {
  try {
    const { category, page = 1, limit = 50 } = request.params;
    
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    const query = new AV.Query(SoftwareInfo);
    
    query.equalTo('status', 'active');
    
    if (category) {
      query.equalTo('category', category);
    }
    
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('downloadCount');
    
    const results = await query.find();
    
    const categoryQuery = new AV.Query(SoftwareInfo);
    categoryQuery.equalTo('status', 'active');
    categoryQuery.select('category');
    const allSoftware = await categoryQuery.find();
    const categories = [...new Set(allSoftware.map(item => item.get('category')))];
    
    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description.substring(0, 80) + '...',
        downloadUrl: data.downloadUrl,
        rating: data.rating,
        downloadCount: data.downloadCount,
        tags: data.tags || []
      };
    });
    
    return {
      success: true,
      data: {
        results: softwareList,
        categories: categories.sort(),
        total: await query.count(),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('获取软件列表失败:', error);
    return {
      success: false,
      message: '获取列表失败，请重试',
      error: error.message
    };
  }
});

/**
 * 检查用户广告观看权限（支持软件ID隔离）
 */
AV.Cloud.define('checkAdPermission', async (request) => {
  try {
    const { userId, hardwareInfo, softwareId, machineId } = request.params;

    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }

    if (!machineId) {
      return {
        success: false,
        message: '机器指纹不能为空'
      };
    }
    
    const UserDevice = AV.Object.extend('UserDevice');
    const deviceQuery = new AV.Query(UserDevice);
    deviceQuery.equalTo('machineId', machineId);
    const device = await deviceQuery.first();
    
    if (!device) {
      return {
        success: false,
        message: '设备未注册，请先注册设备',
        code: 'DEVICE_NOT_REGISTERED',
        hasPermission: false
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    const codeQuery = new AV.Query(DailyAuthCode);
    codeQuery.equalTo('userId', userId);
    codeQuery.equalTo('machineId', machineId);
    codeQuery.greaterThanOrEqualTo('generatedAt', today);
    codeQuery.lessThan('generatedAt', tomorrow);
    codeQuery.containedIn('status', ['active', 'used']);
    
    const existingCode = await codeQuery.first();
    
    if (existingCode) {
      return {
        success: true,
        message: '今日验证码已存在，无需观看广告',
        hasPermission: false,
        reason: 'CODE_ALREADY_EXISTS',
        data: {
          code: existingCode.get('code'),
          machineId: machineId
        }
      };
    }
    
    const AdWatchRecord = AV.Object.extend('AdWatchRecord');
    const adQuery = new AV.Query(AdWatchRecord);
    adQuery.equalTo('userId', userId);
    adQuery.equalTo('machineId', machineId);
    adQuery.equalTo('adType', 'authcode');
    adQuery.greaterThanOrEqualTo('completedAt', today);
    adQuery.lessThan('completedAt', tomorrow);
    adQuery.equalTo('status', 'completed');
    
    const adRecord = await adQuery.first();
    
    if (adRecord) {
      return {
        success: true,
        message: '今日已观看过广告，但验证码可能已使用',
        hasPermission: false,
        reason: 'AD_ALREADY_WATCHED',
        data: {
          machineId: machineId,
          lastWatchTime: adRecord.get('completedAt')
        }
      };
    }
    
    return {
      success: true,
      message: '可以观看广告获取验证码',
      hasPermission: true,
      data: {
        machineId: machineId,
        deviceId: device.id
      }
    };
    
  } catch (error) {
    console.error('检查广告权限失败:', error);
    return {
      success: false,
      message: '检查权限失败，请重试',
      error: error.message,
      hasPermission: false
    };
  }
});

// 此处省略 Express 服务器代码（保持原样）...
// 如需完整代码，请查看原 index.js 文件

// ==================== 管理员工具云函数（新增）====================
// ==================== 以下代码使用 Master Key 确保安全 ====================

/**
 * 管理员登录
 */
AV.Cloud.define('adminLogin', async (request) => {
  try {
    const { username, password } = request.params;

    if (!username || !password) {
      return {
        success: false,
        message: '用户名和密码不能为空'
      };
    }

    const user = await AV.User.logIn(username, password);

    const role = user.get('role');
    if (role !== 'admin') {
      return {
        success: false,
        message: '权限不足，仅管理员可登录'
      };
    }

    return {
      success: true,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.get('username'),
        sessionToken: user.getSessionToken(),
        role: role
      }
    };
  } catch (error) {
    console.error('管理员登录失败:', error);
    return {
      success: false,
      message: error.message || '登录失败，请检查用户名和密码'
    };
  }
});

/**
 * 验证管理员令牌
 */
AV.Cloud.define('verifyAdminToken', async (request) => {
  try {
    const { sessionToken } = request.params;

    if (!sessionToken) {
      return {
        success: false,
        message: 'Session Token不能为空'
      };
    }

    const user = await AV.User.become(sessionToken);

    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        username: user.get('username'),
        role: user.get('role')
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Token验证失败'
    };
  }
});

/**
 * 修改管理员密码
 */
AV.Cloud.define('changeAdminPassword', async (request) => {
  try {
    const { sessionToken, oldPassword, newPassword } = request.params;

    const user = await AV.User.become(sessionToken);

    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    await AV.User.logIn(user.get('username'), oldPassword);

    user.setPassword(newPassword);
    await user.save();

    return {
      success: true,
      message: '密码修改成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '密码修改失败'
    };
  }
});

/**
 * 获取系统配置
 */
AV.Cloud.define('getSystemConfig', async (request) => {
  try {
    const { configKey } = request.params;

    const query = new AV.Query('SystemConfig');
    query.equalTo('configKey', configKey);

    const config = await query.first();

    if (!config) {
      const defaults = {
        'ad_enabled': { enabled: true },
        'ad_rotation': { enabled: false },
        'min_watch_progress': { value: 80 }
      };
      return {
        success: true,
        data: {
          configKey: configKey,
          configValue: defaults[configKey] || {}
        }
      };
    }

    return {
      success: true,
      data: {
        configKey: config.get('configKey'),
        configValue: config.get('configValue'),
        description: config.get('description')
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取配置失败'
    };
  }
});

/**
 * 更新系统配置（使用Master Key）
 */
AV.Cloud.define('updateSystemConfig', async (request) => {
  try {
    const { sessionToken, configKey, configValue, description } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SystemConfig');
    query.equalTo('configKey', configKey);

    let config = await query.first();

    if (!config) {
      const SystemConfig = AV.Object.extend('SystemConfig');
      config = new SystemConfig();
      config.set('configKey', configKey);
    }

    config.set('configValue', configValue);
    if (description) {
      config.set('description', description);
    }

    await config.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '配置更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '配置更新失败'
    };
  }
});

/**
 * 获取广告开关状态（前端调用）
 */
AV.Cloud.define('getAdStatus', async (request) => {
  try {
    const query = new AV.Query('SystemConfig');
    query.equalTo('configKey', 'ad_enabled');

    const config = await query.first();

    if (!config) {
      return {
        success: true,
        data: {
          enabled: true
        }
      };
    }

    return {
      success: true,
      data: config.get('configValue')
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取广告状态失败'
    };
  }
});

/**
 * 切换广告开关（使用Master Key）
 */
AV.Cloud.define('toggleAdStatus', async (request) => {
  try {
    const { sessionToken, enabled } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SystemConfig');
    query.equalTo('configKey', 'ad_enabled');

    let config = await query.first();

    if (!config) {
      const SystemConfig = AV.Object.extend('SystemConfig');
      config = new SystemConfig();
      config.set('configKey', 'ad_enabled');
      config.set('description', '广告功能总开关');
    }

    config.set('configValue', { enabled: enabled });
    await config.save(null, { useMasterKey: true });

    return {
      success: true,
      message: enabled ? '广告已开启' : '广告已关闭',
      data: { enabled }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '操作失败'
    };
  }
});

/**
 * 添加广告配置（使用Master Key）
 */
AV.Cloud.define('addAdConfig', async (request) => {
  try {
    const { sessionToken, adData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const AdConfig = AV.Object.extend('AdConfig');
    const ad = new AdConfig();

    const adId = 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    ad.set('adId', adId);
    ad.set('adName', adData.adName);
    ad.set('adType', adData.adType);
    ad.set('videoUrl', adData.videoUrl || '');
    ad.set('linkUrl', adData.linkUrl || '');
    ad.set('duration', adData.duration || 0);
    ad.set('minWatchProgress', adData.minWatchProgress || 80);
    ad.set('minWatchDuration', adData.minWatchDuration || 0);
    ad.set('adPosition', adData.adPosition || 'authcode');
    ad.set('priority', adData.priority || 50);
    ad.set('status', adData.status || 'inactive');
    ad.set('viewCount', 0);

    await ad.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '广告添加成功',
      data: {
        adId: adId
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '广告添加失败'
    };
  }
});

/**
 * 获取广告列表（管理员）
 */
AV.Cloud.define('getAdList', async (request) => {
  try {
    const { sessionToken, page = 1, limit = 20 } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('AdConfig');
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('createdAt');

    const results = await query.find();
    const total = await query.count();

    const adList = results.map(ad => ({
      id: ad.id,
      adId: ad.get('adId'),
      adName: ad.get('adName'),
      adType: ad.get('adType'),
      videoUrl: ad.get('videoUrl'),
      linkUrl: ad.get('linkUrl'),
      duration: ad.get('duration'),
      minWatchProgress: ad.get('minWatchProgress'),
      minWatchDuration: ad.get('minWatchDuration'),
      adPosition: ad.get('adPosition'),
      priority: ad.get('priority'),
      status: ad.get('status'),
      viewCount: ad.get('viewCount'),
      createdAt: ad.get('createdAt')
    }));

    return {
      success: true,
      data: {
        list: adList,
        total,
        page,
        limit
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取广告列表失败'
    };
  }
});

/**
 * 更新广告配置（使用Master Key）
 */
AV.Cloud.define('updateAdConfig', async (request) => {
  try {
    const { sessionToken, adId, adData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('AdConfig');
    query.equalTo('adId', adId);

    const ad = await query.first();

    if (!ad) {
      return {
        success: false,
        message: '广告不存在'
      };
    }

    Object.keys(adData).forEach(key => {
      if (adData[key] !== undefined) {
        ad.set(key, adData[key]);
      }
    });

    await ad.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '广告更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '广告更新失败'
    };
  }
});

/**
 * 删除广告（使用Master Key）
 */
AV.Cloud.define('deleteAd', async (request) => {
  try {
    const { sessionToken, adId } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('AdConfig');
    query.equalTo('adId', adId);

    const ad = await query.first();

    if (!ad) {
      return {
        success: false,
        message: '广告不存在'
      };
    }

    await ad.destroy({ useMasterKey: true });

    return {
      success: true,
      message: '广告删除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '广告删除失败'
    };
  }
});

/**
 * 获取当前活跃广告（前端调用）
 */
AV.Cloud.define('getActiveAd', async (request) => {
  try {
    const { adPosition = 'authcode' } = request.params;

    const query = new AV.Query('AdConfig');
    query.equalTo('status', 'active');
    query.equalTo('adPosition', adPosition);
    query.descending('priority');

    const results = await query.find();

    if (results.length === 0) {
      return {
        success: true,
        data: {
          videoUrl: './videos/1.mp4',
          duration: 30,
          minWatchProgress: 80,
          minWatchDuration: 24,
          isDefault: true
        }
      };
    }

    const totalPriority = results.reduce((sum, ad) => sum + ad.get('priority'), 0);
    let random = Math.random() * totalPriority;

    let selectedAd = results[0];
    for (const ad of results) {
      random -= ad.get('priority');
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }

    selectedAd.increment('viewCount');
    await selectedAd.save(null, { useMasterKey: true });

    return {
      success: true,
      data: {
        adId: selectedAd.get('adId'),
        adName: selectedAd.get('adName'),
        adType: selectedAd.get('adType'),
        videoUrl: selectedAd.get('videoUrl'),
        linkUrl: selectedAd.get('linkUrl'),
        duration: selectedAd.get('duration'),
        minWatchProgress: selectedAd.get('minWatchProgress'),
        minWatchDuration: selectedAd.get('minWatchDuration'),
        isDefault: false
      }
    };
  } catch (error) {
    console.error('获取活跃广告失败:', error);
    return {
      success: true,
      data: {
        videoUrl: './videos/1.mp4',
        duration: 30,
        minWatchProgress: 80,
        minWatchDuration: 24,
        isDefault: true
      }
    };
  }
});

/**
 * 添加软件（使用Master Key）
 */
AV.Cloud.define('addSoftware', async (request) => {
  try {
    const { sessionToken, softwareData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    const software = new SoftwareInfo();

    Object.keys(softwareData).forEach(key => {
      software.set(key, softwareData[key]);
    });

    if (!softwareData.status) {
      software.set('status', 'active');
    }
    if (!softwareData.rating) {
      software.set('rating', 0);
    }
    if (!softwareData.downloadCount) {
      software.set('downloadCount', 0);
    }

    await software.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '软件添加成功',
      data: {
        id: software.id
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '软件添加失败'
    };
  }
});

/**
 * 更新软件（使用Master Key）
 */
AV.Cloud.define('updateSoftware', async (request) => {
  try {
    const { sessionToken, softwareId, softwareData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SoftwareInfo');
    const software = await query.get(softwareId);

    if (!software) {
      return {
        success: false,
        message: '软件不存在'
      };
    }

    Object.keys(softwareData).forEach(key => {
      if (softwareData[key] !== undefined) {
        software.set(key, softwareData[key]);
      }
    });

    await software.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '软件更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '软件更新失败'
    };
  }
});

/**
 * 删除软件（使用Master Key）
 */
AV.Cloud.define('deleteSoftware', async (request) => {
  try {
    const { sessionToken, softwareId } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SoftwareInfo');
    const software = await query.get(softwareId);

    if (!software) {
      return {
        success: false,
        message: '软件不存在'
      };
    }

    await software.destroy({ useMasterKey: true });

    return {
      success: true,
      message: '软件删除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '软件删除失败'
    };
  }
});

/**
 * 批量删除软件（使用Master Key）
 */
AV.Cloud.define('batchDeleteSoftware', async (request) => {
  try {
    const { sessionToken, softwareIds } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    if (!Array.isArray(softwareIds) || softwareIds.length === 0) {
      return {
        success: false,
        message: '请选择要删除的软件'
      };
    }

    const query = new AV.Query('SoftwareInfo');
    query.containedIn('objectId', softwareIds);

    const results = await query.find();

    await AV.Object.destroyAll(results, { useMasterKey: true });

    return {
      success: true,
      message: `成功删除 ${results.length} 个软件`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '批量删除失败'
    };
  }
});

/**
 * 获取所有软件（管理员）
 */
AV.Cloud.define('getAllSoftware', async (request) => {
  try {
    const { sessionToken, page = 1, limit = 50 } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SoftwareInfo');
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('createdAt');

    const results = await query.find();
    const total = await query.count();

    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        ...data
      };
    });

    return {
      success: true,
      data: {
        list: softwareList,
        total,
        page,
        limit
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取软件列表失败'
    };
  }
});

/**
 * 添加搜索信息（使用Master Key）
 */
AV.Cloud.define('addSearchInfo', async (request) => {
  try {
    const { sessionToken, searchData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const SearchInfo = AV.Object.extend('SearchInfo');
    const searchInfo = new SearchInfo();

    const searchId = 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    searchInfo.set('searchId', searchId);
    searchInfo.set('softwareName', searchData.softwareName);
    searchInfo.set('functionality', searchData.functionality || '');
    searchInfo.set('detailInfo', searchData.detailInfo || '');
    searchInfo.set('category', searchData.category || '其他');
    searchInfo.set('tags', searchData.tags || []);
    searchInfo.set('officialWebsite', searchData.officialWebsite || '');
    searchInfo.set('thumbnail', searchData.thumbnail || '');
    searchInfo.set('status', searchData.status || 'active');
    searchInfo.set('viewCount', 0);

    await searchInfo.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '搜索信息添加成功',
      data: {
        searchId: searchId
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '搜索信息添加失败'
    };
  }
});

/**
 * 更新搜索信息（使用Master Key）
 */
AV.Cloud.define('updateSearchInfo', async (request) => {
  try {
    const { sessionToken, searchId, searchData } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SearchInfo');
    query.equalTo('searchId', searchId);

    const searchInfo = await query.first();

    if (!searchInfo) {
      return {
        success: false,
        message: '搜索信息不存在'
      };
    }

    Object.keys(searchData).forEach(key => {
      if (searchData[key] !== undefined) {
        searchInfo.set(key, searchData[key]);
      }
    });

    await searchInfo.save(null, { useMasterKey: true });

    return {
      success: true,
      message: '搜索信息更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '搜索信息更新失败'
    };
  }
});

/**
 * 删除搜索信息（使用Master Key）
 */
AV.Cloud.define('deleteSearchInfo', async (request) => {
  try {
    const { sessionToken, searchId } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SearchInfo');
    query.equalTo('searchId', searchId);

    const searchInfo = await query.first();

    if (!searchInfo) {
      return {
        success: false,
        message: '搜索信息不存在'
      };
    }

    await searchInfo.destroy({ useMasterKey: true });

    return {
      success: true,
      message: '搜索信息删除成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '搜索信息删除失败'
    };
  }
});

/**
 * 批量删除搜索信息（使用Master Key）
 */
AV.Cloud.define('batchDeleteSearchInfo', async (request) => {
  try {
    const { sessionToken, searchIds } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    if (!Array.isArray(searchIds) || searchIds.length === 0) {
      return {
        success: false,
        message: '请选择要删除的搜索信息'
      };
    }

    const query = new AV.Query('SearchInfo');
    query.containedIn('searchId', searchIds);

    const results = await query.find();

    await AV.Object.destroyAll(results, { useMasterKey: true });

    return {
      success: true,
      message: `成功删除 ${results.length} 条搜索信息`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '批量删除失败'
    };
  }
});

/**
 * 获取所有搜索信息（管理员）
 */
AV.Cloud.define('getAllSearchInfo', async (request) => {
  try {
    const { sessionToken, page = 1, limit = 50 } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    const query = new AV.Query('SearchInfo');
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('createdAt');

    const results = await query.find();
    const total = await query.count();

    const searchList = results.map(item => ({
      id: item.id,
      searchId: item.get('searchId'),
      softwareName: item.get('softwareName'),
      functionality: item.get('functionality'),
      detailInfo: item.get('detailInfo'),
      category: item.get('category'),
      tags: item.get('tags'),
      officialWebsite: item.get('officialWebsite'),
      thumbnail: item.get('thumbnail'),
      status: item.get('status'),
      viewCount: item.get('viewCount'),
      createdAt: item.get('createdAt')
    }));

    return {
      success: true,
      data: {
        list: searchList,
        total,
        page,
        limit
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取搜索信息列表失败'
    };
  }
});

/**
 * 搜索功能（前端调用）
 */
AV.Cloud.define('searchInfo', async (request) => {
  try {
    const { keyword, category, page = 1, limit = 20 } = request.params;

    if (!keyword || keyword.trim() === '') {
      return {
        success: false,
        message: '请输入搜索关键词'
      };
    }

    const SearchInfo = AV.Object.extend('SearchInfo');
    let query = new AV.Query(SearchInfo);

    query.equalTo('status', 'active');

    const nameQuery = new AV.Query(SearchInfo);
    nameQuery.contains('softwareName', keyword);

    const funcQuery = new AV.Query(SearchInfo);
    funcQuery.contains('functionality', keyword);

    const detailQuery = new AV.Query(SearchInfo);
    detailQuery.contains('detailInfo', keyword);

    query = AV.Query.or(nameQuery, funcQuery, detailQuery);
    query.equalTo('status', 'active');

    if (category) {
      query.equalTo('category', category);
    }

    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('viewCount');

    const results = await query.find();
    const total = await query.count();

    const searchList = results.map(item => ({
      id: item.id,
      searchId: item.get('searchId'),
      softwareName: item.get('softwareName'),
      functionality: item.get('functionality'),
      detailInfo: item.get('detailInfo'),
      category: item.get('category'),
      tags: item.get('tags') || [],
      officialWebsite: item.get('officialWebsite'),
      thumbnail: item.get('thumbnail')
    }));

    results.forEach(item => {
      item.increment('viewCount');
    });
    await AV.Object.saveAll(results, { useMasterKey: true });

    return {
      success: true,
      data: {
        results: searchList,
        total,
        page,
        limit,
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('搜索失败:', error);
    return {
      success: false,
      message: error.message || '搜索失败，请重试'
    };
  }
});

/**
 * 获取上传Token
 */
AV.Cloud.define('getUploadToken', async (request) => {
  try {
    const { sessionToken, fileName, fileType } = request.params;

    const user = await AV.User.become(sessionToken);
    if (user.get('role') !== 'admin') {
      return {
        success: false,
        message: '权限不足'
      };
    }

    return {
      success: true,
      message: '请使用LeanCloud SDK直接上传文件'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取上传权限失败'
    };
  }
});

// 启动 HTTP 服务器（LeanEngine 必需）
const express = require('express');
const app = express();

app.use(AV.express());

const PORT = process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('LeanEngine app is running on port:', PORT);
  console.log('✅ 所有云函数加载完成（包含管理员工具）');
});

module.exports = AV.Cloud;

