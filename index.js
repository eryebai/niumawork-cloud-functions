/**
 * 牛马Work - LeanCloud云函数
 * 提供软件搜索、验证码生成、广告完成记录等功能
 */

const AV = require('leanengine');

// 初始化LeanEngine
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});

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
      // 创建一个临时设备记录来触发表创建
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
      await tempDevice.destroy(); // 立即删除临时数据
      
      results.UserDevice = '表已创建，等待真实设备注册';
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
      // 创建一个临时验证码记录来触发表创建
      const tempCode = new DailyAuthCode();
      tempCode.set('userId', 'temp_init_user');
      tempCode.set('machineId', 'temp_init_machine');
      tempCode.set('code', 'TEMP00');
      tempCode.set('generatedAt', new Date());
      tempCode.set('expiresAt', new Date());
      tempCode.set('status', 'temp');
      
      await tempCode.save();
      await tempCode.destroy(); // 立即删除临时数据
      
      results.DailyAuthCode = '表已创建，等待验证码生成';
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
      // 创建一个临时广告观看记录来触发表创建
      const tempAd = new AdWatchRecord();
      tempAd.set('userId', 'temp_init_user');
      tempAd.set('machineId', 'temp_init_machine');
      tempAd.set('adType', 'temp');
      tempAd.set('watchProgress', 0);
      tempAd.set('completedAt', new Date());
      tempAd.set('status', 'temp');
      
      await tempAd.save();
      await tempAd.destroy(); // 立即删除临时数据
      
      results.AdWatchRecord = '表已创建，等待广告观看记录';
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
      // 创建一个临时统计记录来触发表创建
      const tempStats = new UsageStatistics();
      tempStats.set('userId', 'temp_init_user');
      tempStats.set('action', 'temp_init');
      tempStats.set('details', { init: true });
      tempStats.set('timestamp', new Date());
      
      await tempStats.save();
      await tempStats.destroy(); // 立即删除临时数据
      
      results.UsageStatistics = '表已创建，等待使用统计';
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
 * 设备注册功能
 */
AV.Cloud.define('registerDevice', async (request) => {
  try {
    const { hardwareInfo } = request.params;
    
    if (!hardwareInfo) {
      return {
        success: false,
        message: '硬件信息不能为空'
      };
    }
    
    // 生成设备指纹
    const machineId = generateMachineFingerprint(hardwareInfo);
    
    // 检查设备是否已注册
    const UserDevice = AV.Object.extend('UserDevice');
    const query = new AV.Query(UserDevice);
    query.equalTo('machineId', machineId);
    
    let device = await query.first();
    
    if (device) {
      // 设备已存在，更新最后活跃时间
      device.set('lastActiveTime', new Date());
      device.set('totalUsageDays', (device.get('totalUsageDays') || 0) + 1);
      await device.save();
      
      return {
        success: true,
        message: '设备信息已更新',
        data: {
          machineId: machineId,
          isNewDevice: false,
          lastActiveTime: device.get('lastActiveTime'),
          totalUsageDays: device.get('totalUsageDays')
        }
      };
    } else {
      // 新设备，创建注册记录
      device = new UserDevice();
      device.set('machineId', machineId);
      device.set('deviceInfo', hardwareInfo);
      device.set('firstRegisterTime', new Date());
      device.set('lastActiveTime', new Date());
      device.set('totalUsageDays', 1);
      device.set('status', 'active');
      
      await device.save();
      
      return {
        success: true,
        message: '设备注册成功',
        data: {
          machineId: machineId,
          isNewDevice: true,
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
 * 生成设备指纹
 */
function generateMachineFingerprint(hardwareInfo) {
  const { cpu, memory, disk, mac, motherboard, os } = hardwareInfo;
  
  // 组合硬件信息生成唯一指纹
  const fingerprint = [
    cpu || '',
    memory || '',
    disk || '',
    mac || '',
    motherboard || '',
    os || ''
  ].join('|');
  
  // 简单哈希算法生成短ID
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转为32位整数
  }
  
  return 'device_' + Math.abs(hash).toString(36);
}

/**
 * 记录使用统计
 */
async function recordUsageStatistics(userId, action, details = {}) {
  try {
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
    // 统计失败不影响主流程
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
    
    // 只返回有效的软件
    query.equalTo('status', 'active');
    
    // 关键词搜索
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
    
    // 分类筛选
    if (category) {
      query.equalTo('category', category);
    }
    
    // 分页
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('downloadCount');
    
    const results = await query.find();
    const total = await query.count();
    
    // 转换为JSON格式
    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description.substring(0, 100) + '...', // 简短描述
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
    
    // 检查用户是否已观看广告
    if (userId) {
      const AdCompletion = AV.Object.extend('AdCompletion');
      const adQuery = new AV.Query(AdCompletion);
      adQuery.equalTo('userId', userId);
      adQuery.equalTo('adType', 'detail');
      adQuery.equalTo('softwareId', softwareId);
      adQuery.greaterThan('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)); // 24小时内
      
      const adCompletion = await adQuery.first();
      if (!adCompletion) {
        return {
          success: false,
          message: '请先观看广告后查看详情',
          requireAd: true
        };
      }
    }
    
    // 获取软件详情
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
 * 生成验证码
 */
AV.Cloud.define('generateAuthCode', async (request) => {
  try {
    const { userId, hardwareInfo } = request.params;
    
    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }
    
    if (!hardwareInfo) {
      return {
        success: false,
        message: '硬件信息不能为空'
      };
    }
    
    // 生成机器指纹
    const machineId = generateMachineFingerprint(hardwareInfo);
    
    // 检查设备是否已注册
    const UserDevice = AV.Object.extend('UserDevice');
    const deviceQuery = new AV.Query(UserDevice);
    deviceQuery.equalTo('machineId', machineId);
    const device = await deviceQuery.first();
    
    if (!device) {
      return {
        success: false,
        message: '设备未注册，请先注册设备',
        code: 'DEVICE_NOT_REGISTERED'
      };
    }
    
    // 检查今日是否已生成过验证码
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    const query = new AV.Query(DailyAuthCode);
    query.equalTo('userId', userId);
    query.equalTo('machineId', machineId);
    query.greaterThanOrEqualTo('generatedAt', today);
    query.lessThan('generatedAt', tomorrow);
    query.equalTo('status', 'active');
    
    const existingCode = await query.first();
    if (existingCode) {
      const data = existingCode.toJSON();
      return {
        success: true,
        data: {
          code: data.code,
          expiryTime: '23:59:59',
          isNew: false,
          message: '今日验证码已生成',
          machineId: machineId
        }
      };
    }
    
    // 生成新的验证码（6位字母数字组合）
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 保存到数据库
    const authCode = new DailyAuthCode();
    authCode.set('userId', userId);
    authCode.set('machineId', machineId);
    authCode.set('code', code);
    authCode.set('generatedAt', new Date());
    authCode.set('expiresAt', tomorrow);
    authCode.set('status', 'active');
    authCode.set('hardwareInfo', hardwareInfo);
    
    await authCode.save();
    
    // 记录使用统计
    await recordUsageStatistics(userId, 'auth_code_generated', {
      machineId: machineId,
      codeLength: code.length
    });
    
    return {
      success: true,
      data: {
        code: code,
        expiryTime: '23:59:59',
        isNew: true,
        message: '验证码生成成功',
        machineId: machineId
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
 * 验证验证码
 */
AV.Cloud.define('validateAuthCode', async (request) => {
  try {
    const { code, userId, hardwareInfo } = request.params;
    
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
    
    if (!hardwareInfo) {
      return {
        success: false,
        message: '硬件信息不能为空'
      };
    }
    
    // 生成机器指纹
    const machineId = generateMachineFingerprint(hardwareInfo);
    
    const DailyAuthCode = AV.Object.extend('DailyAuthCode');
    const query = new AV.Query(DailyAuthCode);
    query.equalTo('code', code.toUpperCase());
    query.equalTo('userId', userId);
    query.equalTo('machineId', machineId);
    query.equalTo('status', 'active');
    
    const authCode = await query.first();
    
    if (!authCode) {
      return {
        success: false,
        message: '验证码无效、已使用或设备不匹配',
        code: 'INVALID_CODE'
      };
    }
    
    // 检查是否过期
    const now = new Date();
    const expiresAt = authCode.get('expiresAt');
    
    if (now >= expiresAt) {
      // 将过期的验证码标记为失效
      authCode.set('status', 'expired');
      await authCode.save();
      
      return {
        success: false,
        message: '验证码已过期，请重新获取',
        code: 'CODE_EXPIRED'
      };
    }
    
    // 标记验证码为已使用
    authCode.set('status', 'used');
    authCode.set('usedAt', new Date());
    await authCode.save();
    
    // 记录使用统计
    await recordUsageStatistics(userId, 'auth_code_validated', {
      machineId: machineId,
      codeUsed: code,
      validationTime: new Date()
    });
    
    return {
      success: true,
      message: '验证码验证成功',
      data: {
        code: authCode.get('code'),
        userId: authCode.get('userId'),
        machineId: machineId,
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
    
    // 检查观看进度是否达标
    if (watchProgress < 80) {
      return {
        success: false,
        message: '广告观看不完整，请重新观看'
      };
    }
    
    // 检查是否已记录过（防止重复）
    const AdCompletion = AV.Object.extend('AdCompletion');
    const query = new AV.Query(AdCompletion);
    query.equalTo('userId', userId);
    query.equalTo('adType', adType);
    
    if (softwareId) {
      query.equalTo('softwareId', softwareId);
    }
    
    query.greaterThan('createdAt', new Date(Date.now() - 60 * 60 * 1000)); // 1小时内
    
    const existing = await query.first();
    if (existing) {
      return {
        success: true,
        message: '广告观看记录已存在',
        data: { alreadyExists: true }
      };
    }
    
    // 记录广告观看完成
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
    
    // 获取所有分类
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
 * 检查用户广告观看权限
 */
AV.Cloud.define('checkAdPermission', async (request) => {
  try {
    const { userId, hardwareInfo } = request.params;
    
    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }
    
    if (!hardwareInfo) {
      return {
        success: false,
        message: '硬件信息不能为空'
      };
    }
    
    // 生成机器指纹
    const machineId = generateMachineFingerprint(hardwareInfo);
    
    // 检查设备是否已注册
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
    
    // 检查今日是否已生成过验证码
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
    codeQuery.equalTo('status', 'active');
    
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
    
    // 检查今日是否已观看过广告
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
    
    // 用户可以观看广告获取验证码
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

module.exports = AV.Cloud;

// 启动HTTP服务器
const express = require('express');
const app = express();

// 使用LeanEngine中间件
app.use(require('leanengine').express());

const PORT = process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('LeanEngine app is running on port:', PORT);
});

